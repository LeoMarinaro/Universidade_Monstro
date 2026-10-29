// Where to go after logging in (e.g. back to an invite link). Only paths on
// this site are accepted: "//evil.com" or "https://…" would send people away.
export function safeNextPath(value: string | null | undefined) {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/";
}
