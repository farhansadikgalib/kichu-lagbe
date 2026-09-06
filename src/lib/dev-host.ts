/** Hosts that mean "this is a developer's machine", with or without a port. */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** True for a request `Host` header such as "localhost:3000" or "127.0.0.1". */
export function isLocalHost(host: string | null | undefined) {
  if (!host) return false;
  const name = host.startsWith("[") ? host.slice(0, host.indexOf("]") + 1) : host.split(":")[0];
  return LOCAL_HOSTS.has(name.toLowerCase());
}
