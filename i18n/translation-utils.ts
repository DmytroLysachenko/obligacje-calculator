type TranslationTree = Record<string, unknown>;

// Covers the most common mojibake fragments produced by UTF-8 text
// being decoded as latin1/windows-1252 on Windows and in copied JSON.
const MOJIBAKE_PATTERN = /[ÃÅÄÂâœž™�]/;

function tryDecodeLatin1AsUtf8(value: string): string {
  try {
    const bytes = Uint8Array.from(Array.from(value), (char) => char.charCodeAt(0) & 0xff);
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    return decoded.includes('\uFFFD') ? value : decoded;
  } catch {
    return value;
  }
}

export function repairMojibakeText(value: string): string {
  if (!MOJIBAKE_PATTERN.test(value)) {
    return value;
  }

  const repaired = tryDecodeLatin1AsUtf8(value);
  return repaired.trim().length > 0 ? repaired : value;
}

function normalizeNode(node: unknown): unknown {
  if (typeof node === 'string') {
    return repairMojibakeText(node);
  }

  if (Array.isArray(node)) {
    return node.map((entry) => normalizeNode(entry));
  }

  if (node && typeof node === 'object') {
    return Object.fromEntries(
      Object.entries(node as TranslationTree).map(([key, value]) => [key, normalizeNode(value)]),
    );
  }

  return node;
}

export function normalizeTranslations<T extends TranslationTree>(tree: T): T {
  return normalizeNode(tree) as T;
}

function getNestedValue(source: TranslationTree, path: string[]) {
  let current: unknown = source;

  for (const segment of path) {
    if (!current || typeof current !== 'object' || !(segment in (current as TranslationTree))) {
      return undefined;
    }

    current = (current as TranslationTree)[segment];
  }

  return current;
}

function humanizeMissingKey(key: string) {
  const lastSegment = key.split('.').at(-1) ?? key;
  return lastSegment
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function interpolateNode(
  node: unknown,
  variables?: Record<string, string | number>,
): unknown {
  if (!variables) {
    return node;
  }

  if (typeof node === 'string') {
    let text = node;

    Object.entries(variables).forEach(([name, value]) => {
      text = text.replace(new RegExp(`{{${name}}}`, 'g'), String(value));
    });

    return text;
  }

  if (Array.isArray(node)) {
    return node.map((entry) => interpolateNode(entry, variables));
  }

  if (node && typeof node === 'object') {
    return Object.fromEntries(
      Object.entries(node as TranslationTree).map(([key, value]) => [
        key,
        interpolateNode(value, variables),
      ]),
    );
  }

  return node;
}

export function resolveTranslationNode(
  translations: Record<string, TranslationTree>,
  language: string,
  key: string,
  variables?: Record<string, string | number>,
) {
  const path = key.split('.');
  const selected = getNestedValue(translations[language] ?? {}, path);

  if (selected !== undefined) {
    return interpolateNode(selected, variables);
  }

  const fallback = getNestedValue(translations.en ?? {}, path);
  if (fallback !== undefined) {
    return interpolateNode(fallback, variables);
  }

  return humanizeMissingKey(key);
}

export function resolveTranslationValue(
  translations: Record<string, TranslationTree>,
  language: string,
  key: string,
  variables?: Record<string, string | number>,
) {
  const resolved = resolveTranslationNode(translations, language, key, variables);
  return typeof resolved === 'string' ? repairMojibakeText(resolved) : humanizeMissingKey(key);
}

