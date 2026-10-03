export const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1513029076697916";

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[][];
      push?: (...args: unknown[]) => void;
      loaded?: boolean;
      version?: string;
    };
    _fbq?: Window["fbq"];
  }
}

export function trackMetaPageView() {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", "PageView");
}

export function trackMetaCompleteRegistration(responseId: string) {
  if (typeof window === "undefined") return;

  const eventKey = `clinic-compass:meta-complete-registration:${responseId || "current"}`;
  if (window.sessionStorage.getItem(eventKey)) return;

  window.sessionStorage.setItem(eventKey, "pending");
  let count = 0;
  const timer = window.setInterval(() => {
    count += 1;
    if (typeof window.fbq === "function") {
      window.fbq("track", "CompleteRegistration");
      window.sessionStorage.setItem(eventKey, "sent");
      window.clearInterval(timer);
      console.info("[clinic-compass] Meta CompleteRegistration sent");
    } else if (count >= 10) {
      window.sessionStorage.removeItem(eventKey);
      window.clearInterval(timer);
      console.warn("[clinic-compass] Meta CompleteRegistration skipped because fbq was unavailable");
    }
  }, 500);
}
