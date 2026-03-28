type TranslationTree = Record<string, unknown>;

const MOJIBAKE_PATTERN = /[ÃÅÄâ�]/;

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

export function resolveTranslationValue(
  translations: Record<string, TranslationTree>,
  language: string,
  key: string,
) {
  const path = key.split('.');
  const selected = getNestedValue(translations[language] ?? {}, path);

  if (typeof selected === 'string') {
    return repairMojibakeText(selected);
  }

  const fallback = getNestedValue(translations.en ?? {}, path);
  if (typeof fallback === 'string') {
    return repairMojibakeText(fallback);
  }

  return humanizeMissingKey(key);
}

