/**
 * Watch a browser permission via the Permissions API. `callback` receives the
 * status once it resolves and again whenever it changes (e.g. from the site
 * settings), so the UI reflects a block without a reload. Browsers that lack
 * the query, or the name, never call back; the caller's own prompt result
 * still drives the UI.
 */
export function subscribePermission(
  name: PermissionName,
  callback: (status: PermissionStatus) => void,
) {
  let cancelled = false;
  let cleanup = () => {};
  if (typeof navigator !== "undefined" && navigator.permissions?.query) {
    navigator.permissions
      .query({ name })
      .then((status) => {
        if (cancelled) return;
        const onChange = () => callback(status);
        status.addEventListener("change", onChange);
        cleanup = () => status.removeEventListener("change", onChange);
        callback(status);
      })
      .catch(() => {
        /* unsupported permission name on this browser */
      });
  }
  return () => {
    cancelled = true;
    cleanup();
  };
}
