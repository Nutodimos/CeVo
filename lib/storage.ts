const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

/**
 * Upload a captured card photo to Cloudinary.
 * Uses the unsigned upload REST API with the same cloud name and upload preset
 * already configured for candidate photos.
 */
export async function uploadCardPhoto(
  buffer: Buffer,
  filename: string
): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Missing Cloudinary config: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET must be set."
    );
  }

  const formData = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: "image/jpeg" });
  formData.append("file", blob, filename);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "card-photos");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const body = await res.text();
    console.error("Cloudinary upload failed:", res.status, body);
    throw new Error("Failed to upload card photo to Cloudinary");
  }

  const data = await res.json();
  return data.secure_url;
}

/**
 * Delete a card photo from Cloudinary.
 * Note: Unsigned deletion is not supported by Cloudinary, so this is a
 * best-effort no-op. Photos in the "card-photos" folder can be cleaned up
 * via the Cloudinary dashboard or a signed server-side SDK if needed.
 */
export async function deleteCardPhoto(url: string): Promise<boolean> {
  // Cloudinary unsigned uploads don't support deletion via API.
  // Log the URL for manual cleanup if needed.
  if (url) {
    console.log("deleteCardPhoto: skipping Cloudinary deletion for:", url);
  }
  return true;
}
