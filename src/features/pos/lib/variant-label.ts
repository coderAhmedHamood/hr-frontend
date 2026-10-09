const SEGMENT = /\s*[—–\-]\s*/;

/** The part of a variant name that is not the product name or a shared prefix. */
export function variantHeadlines(productName: string, names: string[]): string[] {
  const cleaned = names.map((name) => stripProduct(productName, name));
  const segments = cleaned.map((text) => text.split(SEGMENT).map((part) => part.trim()).filter(Boolean));
  let shared = 0;
  if (segments.length > 1 && segments.every((parts) => parts.length > 1)) {
    while (
      segments.every(
        (parts) => parts.length > shared + 1 && parts[shared] === segments[0]?.[shared],
      )
    ) {
      shared += 1;
    }
  }
  return segments.map((parts, index) => {
    const rest = parts.slice(shared).join(' · ');
    return rest || cleaned[index] || names[index] || '';
  });
}

export function variantHeadline(productName: string, variantName: string): string {
  return variantHeadlines(productName, [variantName])[0] ?? variantName;
}

function stripProduct(productName: string, variantName: string): string {
  const name = variantName.trim();
  const product = productName.trim();
  if (!product || !name.startsWith(product)) return name;
  return name.slice(product.length).replace(/^[\s—–\-]+/, '') || name;
}
