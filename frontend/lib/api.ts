export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
export function assetUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("ipfs://")) return path;
  return `${API_URL}${path}`;
}
