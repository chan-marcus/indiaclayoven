/** Longest side, in pixels, of a dish photo once resized. */
const MAX_SIDE = 1600;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

/**
 * Resizes a photo in the browser before upload, so a 10 MB phone picture
 * becomes a few hundred KB. Falls back to the original file when the browser
 * can't read it, as long as it's already a web image.
 */
export async function shrinkImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d")!;
    // JPEG has no transparency; give see-through PNGs a white background.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.85));
    if (blob) return blob;
  } catch {
    /* fall through to the original */
  }
  if (ACCEPTED.includes(file.type)) return file;
  throw new Error("That file isn't a photo we can use. Try a JPG or PNG.");
}
