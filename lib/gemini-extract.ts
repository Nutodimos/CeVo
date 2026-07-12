import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function extractMatricNumber(imageUrl: string, institutionName?: string): Promise<{
  extractedMatric: string | null;
  extractedName: string | null;
  documentValid: boolean;
  confidence: "high" | "low" | "none";
  rawResponse: string;
}> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    let imageBuffer: ArrayBuffer;
    let mimeType = "image/jpeg";
    
    if (imageUrl.startsWith("http")) {
      const imageResponse = await fetch(imageUrl);
      imageBuffer = await imageResponse.arrayBuffer();
      const contentType = imageResponse.headers.get("content-type");
      if (contentType) mimeType = contentType;
    } else {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`;
      const localUrl = `${baseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
      const imageResponse = await fetch(localUrl);
      imageBuffer = await imageResponse.arrayBuffer();
    }

    const base64Image = Buffer.from(imageBuffer).toString("base64");
    
    const institution = institutionName || "University of Ilorin";

    const prompt = `You are verifying a student document for an election system.

STEP 1 — DOCUMENT VALIDATION
Look for these features of an authentic ${institution} course registration form:
- ${institution} crest or name in the header
- The text "FINAL COURSE REGISTRATION FORM" or "COURSE REGISTRATION FORM"
- A printed info table with labelled fields (Reg/Matriculation No, Full-Name, Faculty, Department)
- A "Date Printed:" timestamp line

If the image clearly does NOT show an official ${institution} document (e.g. handwritten note, plain paper, typed document without university branding, screenshot of a chat/website), set DOCUMENT to INVALID.

STEP 2 — DATA EXTRACTION
Extract the following from the info table at the top of the form:
- The value next to "Reg/Matriculation No" or "Matric No"
- The value next to "Full-Name" — extract ONLY the first two names/words (ignore any third name or middle name)

Matric number format reference: YY/XXGRYYYY (examples: 20/30GR015, 19/25EC042, 21/52EE103)

STEP 3 — CONFIDENCE
Rate your confidence in the extracted matric number and name:
- HIGH: clearly printed, fully visible, unambiguous
- LOW: partially visible, slightly blurry, but you can make a reasonable read
- NONE: completely unreadable or not visible at all

Respond ONLY in this exact format — no extra text, punctuation, or explanation outside these lines:
DOCUMENT: [VALID or INVALID]
MATRIC: [extracted matric number or NOT_FOUND]
NAME: [first two names only, uppercase, or NOT_FOUND]
CONFIDENCE: [HIGH or LOW or NONE]`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
    ]);

    const rawResponse = result.response.text().trim();

    const documentMatch  = rawResponse.match(/DOCUMENT:\s*(VALID|INVALID)/);
    const matricMatch    = rawResponse.match(/MATRIC:\s*([^\n]+)/);
    const nameMatch      = rawResponse.match(/NAME:\s*([^\n]+)/);
    const confidenceMatch = rawResponse.match(/CONFIDENCE:\s*(HIGH|LOW|NONE)/);

    const documentValid    = documentMatch?.[1] === "VALID";
    const extractedMatric  = matricMatch?.[1]?.trim().replace(/\s+/g, "") || null;
    const extractedName    = nameMatch?.[1]?.trim().toUpperCase() || null;
    const confidenceRaw    = confidenceMatch?.[1] ?? "NONE";

    return {
      extractedMatric: extractedMatric === "NOT_FOUND" ? null : extractedMatric?.toUpperCase() ?? null,
      extractedName:   extractedName   === "NOT_FOUND" ? null : extractedName,
      documentValid,
      confidence: confidenceRaw === "HIGH" ? "high" : confidenceRaw === "LOW" ? "low" : "none",
      rawResponse,
    };
  } catch (error) {
    console.error("Gemini extraction failed:", error);
    return { extractedMatric: null, extractedName: null, documentValid: false, confidence: "none", rawResponse: error instanceof Error ? error.message : "Unknown error" };
  }
}
