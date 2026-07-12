import { NextRequest, NextResponse } from "next/server";
import { verifyVoterSession } from "@/lib/session";
import { uploadCardPhoto } from "@/lib/storage";
import crypto from "crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  try {
    // Verify voter session
    const session = await verifyVoterSession();
    if (!session || session.phase !== "capture") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("photo") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No photo provided" },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP images are accepted." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5 MB." },
        { status: 400 }
      );
    }

    // Use a random UUID for the filename — never embed the matric number,
    // which would create a permanent identity linkage in the filesystem.
    const filename = `card_${crypto.randomUUID()}.jpg`;

    // Convert File to Buffer and upload
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadCardPhoto(buffer, filename);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
