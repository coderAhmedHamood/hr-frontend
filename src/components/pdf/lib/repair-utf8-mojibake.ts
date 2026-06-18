/**
 * Decode a substring whose code units are all U+00xx — i.e. mis-read UTF‑8 stored as ISO‑8859-1 characters.
 */
function decodeLatin1MaskedUtf8(fragment: string): string {
  try {
    const bytes = new Uint8Array(fragment.length);
    for (let i = 0; i < fragment.length; i++) bytes[i] = fragment.charCodeAt(i);
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return fragment;
  }
}

/**
 * When UTF-8 bytes are read as Latin-1 / ISO-8859-1, each byte becomes U+00xx.
 * Arabic turns into mojibake while ASCII stays readable (e.g. "Next.js").
 *
 * Runs of characters with codepoints ≤ U+00FF are reinterpreted as UTF-8 bytes. Any character
 * > U+00FF (smart quotes • emojis real Arabic Unicode) splits runs so pasted punctuation no
 * longer blocks repair for the rest of the string.
 */
export function repairUtf8MisdecodedAsLatin1(input: string): string {
  if (!input) return '';
  let out = '';
  let buf = '';
  const flush = () => {
    if (!buf) return;
    out += decodeLatin1MaskedUtf8(buf);
    buf = '';
  };
  for (const ch of input) {
    const cp = ch.codePointAt(0) ?? 0;
    if (cp <= 0xff) buf += ch;
    else {
      flush();
      out += ch;
    }
  }
  flush();
  return out;
}

/** Apply {@link repairUtf8MisdecodedAsLatin1} up to `maxPasses` times (handles double-encoded UTF‑8). */
export function repairUtf8MojibakeDeep(input: string, maxPasses = 3): string {
  let prev = input;
  for (let p = 0; p < maxPasses; p++) {
    const next = repairUtf8MisdecodedAsLatin1(prev);
    if (next === prev) break;
    prev = next;
  }
  return prev;
}
