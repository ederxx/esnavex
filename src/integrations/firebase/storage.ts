import { storage } from "./client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function uploadFile(path: string, file: File) {
  const r = ref(storage, path);
  await uploadBytes(r, file);
  const url = await getDownloadURL(r);
  return url;
}
