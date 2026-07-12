import { prisma } from "./prisma";
import { extractMatricNumber } from "./gemini-extract";
import { distance } from "fastest-levenshtein";

function normalizeNameForMatch(name: string): string {
  return name
    .toUpperCase()
    .trim()
    .replace(/[^A-Z\s]/g, "")
    .replace(/\s+/g, " ");
}

function firstTwoNames(fullName: string): string {
  return normalizeNameForMatch(fullName)
    .split(" ")
    .slice(0, 2)
    .join(" ");
}

function nameMatch(rollName: string, extractedName: string): "strong" | "weak" | "none" {
  const a = firstTwoNames(rollName);
  const b = normalizeNameForMatch(extractedName);

  if (a === b) return "strong";

  const lev = distance(a, b);
  if (lev <= 2) return "weak";

  return "none";
}

export async function processVoteVerification(pendingVoteId: string) {
  const pendingVote = await prisma.pendingVote.findUnique({
    where: { id: pendingVoteId },
    include: {
      voterRoll: true,
      election: { include: { organisation: true } }
    }
  });
  if (!pendingVote || pendingVote.status !== "pending_ocr") return;

  const { extractedMatric, extractedName, documentValid, confidence, rawResponse } =
    await extractMatricNumber(pendingVote.cardPhotoUrl, pendingVote.election.organisation.name);

  // If rate limit error occurs, we might get a specific response, but for now
  // let's assume we don't update if we get an empty response and let the sweep job retry
  if (confidence === "none" && rawResponse.toLowerCase().includes("429")) {
    console.warn("Gemini API rate limit reached, will retry later:", pendingVoteId);
    return; // leave as pending_ocr
  }

  const normalize = (s: string) => s.toUpperCase().replace(/[\s\-\/]/g, "");

  const submitted  = normalize(pendingVote.matricNumber);
  const extracted  = extractedMatric ? normalize(extractedMatric) : null;
  const matricOk   = extracted !== null && extracted === submitted;

  // Name check — fetch the name from the voter roll for this matric number
  const voterRollName = pendingVote.voterRoll?.name ?? null;
  const nameResult = (extractedName && voterRollName)
    ? nameMatch(voterRollName, extractedName)
    : "none";

  // ─── Routing table ───────────────────────────────────────────────────────
  let newStatus: string;
  let reviewNote: string | null = null;

  if (!documentValid) {
    newStatus  = "pending_review";
    reviewNote = `Gemini flagged this as not a valid ${pendingVote.election.organisation.name} document.`;
  } else if (matricOk && confidence === "high" && nameResult === "strong") {
    newStatus = "verified";
  } else if (matricOk && (confidence === "low" || nameResult === "weak")) {
    newStatus  = "pending_review";
    reviewNote = `Matric matched but name confidence is low. Roll: "${voterRollName}" | Extracted: "${extractedName}"`;
  } else if (matricOk && nameResult === "none" && extractedName !== null) {
    newStatus  = "pending_review";
    reviewNote = `Matric matched but name mismatch. Roll: "${voterRollName}" | Extracted: "${extractedName}"`;
  } else if (matricOk && extractedName === null) {
    newStatus  = "pending_review";
    reviewNote = "Matric matched but name field was not readable. Likely partial capture.";
  } else {
    newStatus  = "pending_review";
    reviewNote = `Matric not matched. Submitted: "${pendingVote.matricNumber}" | Extracted: "${extractedMatric}"`;
  }

  await prisma.pendingVote.update({
    where: { id: pendingVoteId },
    data: {
      status:           newStatus,
      geminiExtracted:  extractedMatric,
      geminiName:       extractedName,
      geminiDocValid:   documentValid,
      geminiRaw:        rawResponse,
      reviewNote:       reviewNote,
    },
  });
}
