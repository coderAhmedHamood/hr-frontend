import { HERE_CDN_BASE } from "../constants/constants";

// ─────────────────────────────────────────────────────────────────────────────
// HERE Maps CDN loader
// ─────────────────────────────────────────────────────────────────────────────

type HereWindow = Window & {
  H?: {
    service?: { Platform?: unknown };
    mapevents?: unknown;
    ui?: unknown;
  };
};

function getHereWindow(): HereWindow | undefined {
  return typeof window !== "undefined" ? (window as HereWindow) : undefined;
}

function injectStylesheet(href: string): void {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function markScriptLoaded(script: HTMLScriptElement): void {
  script.setAttribute("data-loaded", "true");
}

function waitUntil(isReady: () => boolean, timeoutMs: number, label: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (isReady()) {
        resolve();
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`HERE Maps module not ready: ${label}`));
        return;
      }
      setTimeout(tick, 50);
    };
    tick();
  });
}

function injectScript(
  src: string,
  isReady: () => boolean,
  timeoutMs = 15000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const finish = () => {
      waitUntil(isReady, timeoutMs, src).then(resolve).catch(reject);
    };

    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing?.getAttribute("data-loaded") === "true") {
      finish();
      return;
    }

    if (existing) {
      existing.addEventListener(
        "load",
        () => {
          markScriptLoaded(existing);
          finish();
        },
        { once: true },
      );
      existing.addEventListener(
        "error",
        () => reject(new Error(`فشل تحميل الملف: ${src}`)),
        { once: true },
      );
      // Another caller may already be loading this script — poll until ready.
      waitUntil(
        () => existing.getAttribute("data-loaded") === "true" && isReady(),
        timeoutMs,
        src,
      )
        .then(resolve)
        .catch(reject);
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.type = "text/javascript";
    script.charset = "utf-8";
    script.async = false;
    script.onload = () => {
      markScriptLoaded(script);
      finish();
    };
    script.onerror = () => reject(new Error(`فشل تحميل الملف: ${src}`));
    document.head.appendChild(script);
  });
}

async function loadHereMapsSdkInternal(): Promise<void> {
  injectStylesheet(`${HERE_CDN_BASE}/mapsjs-ui.css`);

  await injectScript(
    `${HERE_CDN_BASE}/mapsjs-core.js`,
    () => Boolean(getHereWindow()?.H),
  );

  await injectScript(
    `${HERE_CDN_BASE}/mapsjs-service.js`,
    () => Boolean(getHereWindow()?.H?.service?.Platform),
  );

  await injectScript(
    `${HERE_CDN_BASE}/mapsjs-mapevents.js`,
    () => Boolean(getHereWindow()?.H?.mapevents),
  );

  await injectScript(
    `${HERE_CDN_BASE}/mapsjs-ui.js`,
    () => Boolean(getHereWindow()?.H?.ui),
  );
}

let sdkLoadPromise: Promise<void> | null = null;

/**
 * Loads the four HERE Maps JS modules in their required dependency order.
 * Each module is injected once and cached by the browser on subsequent mounts.
 */
export function loadHereMapsSdk(): Promise<void> {
  if (!sdkLoadPromise) {
    sdkLoadPromise = loadHereMapsSdkInternal().catch((error) => {
      sdkLoadPromise = null;
      throw error;
    });
  }
  return sdkLoadPromise;
}
