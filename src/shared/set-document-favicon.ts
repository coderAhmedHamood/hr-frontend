const FAVICON_SELECTOR =
  "link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']";

function cacheBustedHref(href: string): string {
  const param = `v=${encodeURIComponent(href)}`;
  return href.includes('?') ? `${href}&${param}` : `${href}?${param}`;
}

/** Replace metadata/default favicon links with the company logo URL. */
export function setDocumentFavicon(href: string): void {
  if (typeof document === 'undefined' || !href) return;

  const nextHref = cacheBustedHref(href);
  const resolved = new URL(nextHref, window.location.origin).href;

  document.querySelectorAll<HTMLLinkElement>(FAVICON_SELECTOR).forEach((link) => {
    if (link.dataset.dynamicFavicon === 'true') {
      if (link.href !== resolved) {
        link.href = nextHref;
      }
      return;
    }
    link.remove();
  });

  let link = document.querySelector<HTMLLinkElement>("link[data-dynamic-favicon='true']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    link.dataset.dynamicFavicon = 'true';
    document.head.appendChild(link);
  }

  if (link.href !== resolved) {
    link.href = nextHref;
  }
}
