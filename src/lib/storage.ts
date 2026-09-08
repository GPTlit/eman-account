import { supabase } from "@/integrations/supabase/client";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
const MAX_BYTES = 5 * 1024 * 1024;

export function validateUpload(file: File): string | null {
  if (!ALLOWED.includes(file.type)) return "unsupported";
  if (file.size > MAX_BYTES) return "too-large";
  return null;
}

export async function uploadTo(bucket: string, folder: string, file: File) {
  const problem = validateUpload(file);
  if (problem) throw new Error(problem);
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw error;
  return `${bucket}/${path}`;
}

/** Stored refs look like "bucket/path/to/file". Returns a temporary signed URL. */
export async function signedUrl(ref: string | null | undefined, expiresIn = 3600) {
  if (!ref) return null;
  const [bucket, ...rest] = ref.split("/");
  if (!bucket || rest.length === 0) return null;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(rest.join("/"), expiresIn);
  return data?.signedUrl ?? null;
}
