const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://localhost:8080";
// GET-only foundation client. Auth refresh and CSRF writes arrive with auth.
export async function api<T>(path: string): Promise<T> {
  const response = await fetch(`${API_ORIGIN}${path}`, { credentials: "include" });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json() as Promise<T>;
}
