/**
 * Global async error surfacing.
 *
 * React's ErrorBoundary only catches errors thrown during render/lifecycle.
 * Promise rejections and errors inside event handlers escape it — without
 * this they'd vanish into the console silently. We log them consistently so
 * failures in data hooks (Supabase calls, async fetches, etc.) are
 * diagnosable instead of being invisible.
 */
export function installGlobalErrorLogger() {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    console.error("[global:error]", event.message, event.error ?? "");
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason =
      event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    console.error("[global:unhandledrejection]", reason.message, reason);
  });
}
