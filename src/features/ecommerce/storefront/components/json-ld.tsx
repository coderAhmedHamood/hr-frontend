/**
 * The only sanctioned way to render JSON-LD in the storefront. `JSON.stringify` does NOT escape
 * `</script>` — a product description containing the literal string `</script><script>...` would
 * close the tag early and inject executable markup. Escaping `<` to `<` neutralizes this
 * without changing the JSON-LD's parsed meaning (schema.org consumers see the same data).
 */
export function JsonLd({ data }: { data: unknown }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
