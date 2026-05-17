import { put, del, type PutBlobResult } from "@vercel/blob";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadImage(
  file: File,
  pathname: string,
): Promise<PutBlobResult> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Unsupported image type: ${file.type}`);
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`Image exceeds ${MAX_IMAGE_BYTES / 1024 / 1024}MB`);
  }
  return put(pathname, file, { access: "public", addRandomSuffix: true });
}

export async function deleteImage(url: string): Promise<void> {
  await del(url);
}
