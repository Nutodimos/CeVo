import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.resolve(process.cwd(), "public", "uploads");

/**
 * Upload a captured card photo to storage.
 * Currently saves to local filesystem (public/uploads/).
 * Swap this implementation for Vercel Blob or S3 in production.
 */
export async function uploadCardPhoto(
  buffer: Buffer,
  filename: string
): Promise<string> {
  // Ensure upload directory exists
  await mkdir(UPLOAD_DIR, { recursive: true });

  const filePath = path.resolve(UPLOAD_DIR, filename);

  // Path traversal guard — ensure resolved path stays inside UPLOAD_DIR
  if (!filePath.startsWith(UPLOAD_DIR + path.sep) && filePath !== UPLOAD_DIR) {
    throw new Error("Invalid filename — path traversal detected");
  }

  await writeFile(filePath, buffer);

  // Return the public URL path
  return `/uploads/${filename}`;
}

/**
 * Delete a card photo from storage.
 */
export async function deleteCardPhoto(url: string): Promise<boolean> {
  try {
    // url looks like "/uploads/filename.jpg"
    // Strip only the leading "/uploads/" prefix — do NOT trust the rest of the path
    const urlPath = url.startsWith("/uploads/") ? url.slice("/uploads/".length) : null;
    if (!urlPath) {
      console.warn("deleteCardPhoto: unexpected URL format, skipping:", url);
      return false;
    }

    // Reject any path that contains directory traversal sequences
    if (urlPath.includes("..") || urlPath.includes("/") || urlPath.includes("\\")) {
      console.error("deleteCardPhoto: path traversal attempt detected:", url);
      return false;
    }

    const filePath = path.resolve(UPLOAD_DIR, urlPath);

    // Final guard: resolved path must be inside UPLOAD_DIR
    if (!filePath.startsWith(UPLOAD_DIR + path.sep)) {
      console.error("deleteCardPhoto: resolved path escapes upload dir:", filePath);
      return false;
    }

    await unlink(filePath);
    return true;
  } catch (err: unknown) {
    // If file doesn't exist, ignore the error
    if (err && typeof err === 'object' && 'code' in err && err.code === "ENOENT") return true;
    console.error("Failed to delete card photo:", err);
    return false;
  }
}
