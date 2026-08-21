import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  DEFAULT_JSON_BODY_MAX_BYTES,
  EmptyJsonBodyError,
  InvalidContentLengthError,
  InvalidJsonEncodingError,
  readBoundedJsonBody,
  readJsonBody,
  readOptionalJsonBody,
  RequestBodyTooLargeError,
  UnsupportedJsonMediaTypeError,
} from './read-json-body';

const PayloadSchema = z
  .object({
    amount: z.number().finite().positive(),
    name: z.string().min(1),
  })
  .strict();

function jsonRequest(
  body: BodyInit | null,
  headers: HeadersInit = { 'content-type': 'application/json' },
) {
  return new NextRequest('https://example.test/api/command', {
    method: 'POST',
    body,
    headers,
  });
}

describe('readJsonBody', () => {
  it('returns a schema-validated JSON command', async () => {
    await expect(
      readJsonBody(jsonRequest(JSON.stringify({ amount: 1200, name: 'IKE' })), PayloadSchema),
    ).resolves.toEqual({ amount: 1200, name: 'IKE' });
  });

  it('accepts application JSON with parameters', async () => {
    await expect(
      readJsonBody(
        jsonRequest(JSON.stringify({ amount: 1200, name: 'IKE' }), {
          'content-type': 'application/json; charset=utf-8',
        }),
        PayloadSchema,
      ),
    ).resolves.toEqual({ amount: 1200, name: 'IKE' });
  });

  it('accepts registered structured JSON suffixes', async () => {
    await expect(
      readJsonBody(
        jsonRequest(JSON.stringify({ amount: 1200, name: 'IKE' }), {
          'content-type': 'application/problem+json',
        }),
        PayloadSchema,
      ),
    ).resolves.toEqual({ amount: 1200, name: 'IKE' });
  });

  it.each([
    undefined,
    'text/plain',
    'text/json',
    'application/jsonp',
    'multipart/form-data; boundary=example',
    'application/x-www-form-urlencoded',
  ])('rejects non-JSON media type %s', async (contentType) => {
    const headers: HeadersInit = contentType ? { 'content-type': contentType } : {};
    await expect(
      readJsonBody(
        jsonRequest(JSON.stringify({ amount: 1200, name: 'IKE' }), headers),
        PayloadSchema,
      ),
    ).rejects.toBeInstanceOf(UnsupportedJsonMediaTypeError);
  });

  it('reports absent JSON body as a distinct client error', async () => {
    await expect(readJsonBody(jsonRequest(null), PayloadSchema)).rejects.toBeInstanceOf(
      EmptyJsonBodyError,
    );
  });

  it.each([' ', '\n\t'])('rejects whitespace-only JSON body %j', async (body) => {
    await expect(readJsonBody(jsonRequest(body), PayloadSchema)).rejects.toBeInstanceOf(
      SyntaxError,
    );
  });

  it.each(['{', '{"amount":', '{"amount": 12,}', '{"amount": 12 "name": "IKE"}', '[1, 2,]'])(
    'rejects malformed JSON %j',
    async (body) => {
      await expect(readJsonBody(jsonRequest(body), PayloadSchema)).rejects.toBeInstanceOf(
        SyntaxError,
      );
    },
  );

  it('passes schema failures through for standardized field-level problems', async () => {
    await expect(
      readJsonBody(
        jsonRequest(JSON.stringify({ amount: -1, name: '', extra: true })),
        PayloadSchema,
      ),
    ).rejects.toBeInstanceOf(z.ZodError);
  });

  it('caps body size before parsing a declared oversized payload', async () => {
    await expect(
      readJsonBody(
        jsonRequest(JSON.stringify({ amount: 1200, name: 'IKE' }), {
          'content-length': '1025',
          'content-type': 'application/json',
        }),
        PayloadSchema,
        { maxBytes: 1024 },
      ),
    ).rejects.toEqual(expect.objectContaining({ maxBytes: 1024 }));
  });

  it.each(['-1', '1.5', '+10', '10 bytes', 'Infinity'])(
    'rejects malformed Content-Length %s',
    async (contentLength) => {
      await expect(
        readJsonBody(
          jsonRequest(JSON.stringify({ amount: 1200, name: 'IKE' }), {
            'content-length': contentLength,
            'content-type': 'application/json',
          }),
          PayloadSchema,
        ),
      ).rejects.toBeInstanceOf(InvalidContentLengthError);
    },
  );

  it('caps streamed input when Content-Length is absent', async () => {
    const payload = JSON.stringify({ amount: 1200, name: 'x'.repeat(512) });
    await expect(readBoundedJsonBody(jsonRequest(payload), PayloadSchema, 32)).rejects.toEqual(
      expect.objectContaining({ maxBytes: 32 }),
    );
  });

  it('permits a route with its own documented media-type contract', async () => {
    await expect(
      readBoundedJsonBody(
        jsonRequest(JSON.stringify({ amount: 1200, name: 'IKE' }), {
          'content-type': 'application/csp-report',
        }),
        PayloadSchema,
        1_024,
        { requireJsonContentType: false },
      ),
    ).resolves.toEqual({ amount: 1200, name: 'IKE' });
  });

  it('does not rely on Content-Length for ordinary valid requests', async () => {
    const request = jsonRequest(JSON.stringify({ amount: 1200, name: 'IKE' }));
    expect(request.headers.get('content-length')).toBeNull();
    await expect(readJsonBody(request, PayloadSchema)).resolves.toEqual({
      amount: 1200,
      name: 'IKE',
    });
  });

  it('uses 64 KiB as a conservative default command limit', async () => {
    const payload = JSON.stringify({ amount: 1200, name: 'x'.repeat(DEFAULT_JSON_BODY_MAX_BYTES) });
    await expect(readJsonBody(jsonRequest(payload), PayloadSchema)).rejects.toBeInstanceOf(
      RequestBodyTooLargeError,
    );
  });

  it('rejects invalid UTF-8 instead of silently replacing bytes', async () => {
    const bytes = new Uint8Array([0xff, 0xfe, 0xfd]);
    await expect(readJsonBody(jsonRequest(bytes), PayloadSchema)).rejects.toBeInstanceOf(
      InvalidJsonEncodingError,
    );
  });

  it('rejects an impossible size configuration', async () => {
    await expect(
      readJsonBody(jsonRequest(JSON.stringify({ amount: 1, name: 'x' })), PayloadSchema, {
        maxBytes: 0,
      }),
    ).rejects.toThrow('maxBytes must be a positive safe integer.');
  });

  it('allows callers with an explicit transport contract to omit Content-Type', async () => {
    await expect(
      readJsonBody(jsonRequest(JSON.stringify({ amount: 1200, name: 'IKE' }), {}), PayloadSchema, {
        requireJsonContentType: false,
      }),
    ).resolves.toEqual({ amount: 1200, name: 'IKE' });
  });

  it.each([
    ['application/json', true],
    ['Application/Json', true],
    ['application/json;charset=UTF-8', true],
    ['application/vnd.obligacje.command+json', true],
    ['application/problem+json; charset=utf-8', true],
    ['application/+json', false],
    ['application/json+xml', false],
    ['application/json;evil', true],
    ['application/jsonp; charset=utf-8', false],
    ['image/svg+xml', false],
  ])('handles JSON media type %s', async (contentType, accepted) => {
    const parse = readJsonBody(
      jsonRequest(JSON.stringify({ amount: 1200, name: 'IKE' }), { 'content-type': contentType }),
      PayloadSchema,
    );

    if (accepted) {
      await expect(parse).resolves.toEqual({ amount: 1200, name: 'IKE' });
      return;
    }
    await expect(parse).rejects.toBeInstanceOf(UnsupportedJsonMediaTypeError);
  });

  it('accepts body exactly at the declared byte boundary', async () => {
    const payload = JSON.stringify({ amount: 1, name: 'x' });
    const bytes = new TextEncoder().encode(payload).byteLength;

    await expect(
      readJsonBody(
        jsonRequest(payload, {
          'content-length': String(bytes),
          'content-type': 'application/json',
        }),
        PayloadSchema,
        { maxBytes: bytes },
      ),
    ).resolves.toEqual({ amount: 1, name: 'x' });
  });

  it('rejects payload one byte over its actual byte boundary', async () => {
    const payload = JSON.stringify({ amount: 1, name: 'ł' });
    const bytes = new TextEncoder().encode(payload).byteLength;

    await expect(
      readJsonBody(jsonRequest(payload), PayloadSchema, { maxBytes: bytes - 1 }),
    ).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });

  it('counts UTF-8 bytes rather than JavaScript string length', async () => {
    const payload = JSON.stringify({ amount: 1, name: '€' });
    const characters = payload.length;
    const bytes = new TextEncoder().encode(payload).byteLength;
    expect(bytes).toBeGreaterThan(characters);

    await expect(
      readJsonBody(jsonRequest(payload), PayloadSchema, { maxBytes: characters }),
    ).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });

  it('does not treat a literal null body as an optional command', async () => {
    await expect(
      readOptionalJsonBody(jsonRequest('null'), PayloadSchema, { amount: 10, name: 'fallback' }),
    ).rejects.toBeInstanceOf(z.ZodError);
  });
});

describe('readOptionalJsonBody', () => {
  const fallback = { amount: 100, name: 'default' };

  it('uses fallback for an absent body without requiring a media type', async () => {
    await expect(
      readOptionalJsonBody(jsonRequest(null, {}), PayloadSchema, fallback),
    ).resolves.toEqual(fallback);
  });

  it('uses fallback for an explicit zero-length body', async () => {
    await expect(
      readOptionalJsonBody(jsonRequest(null, { 'content-length': '0' }), PayloadSchema, fallback),
    ).resolves.toEqual(fallback);
  });

  it('does not hide malformed JSON behind fallback', async () => {
    await expect(
      readOptionalJsonBody(jsonRequest('{'), PayloadSchema, fallback),
    ).rejects.toBeInstanceOf(SyntaxError);
  });

  it('does not hide unsupported media types behind fallback', async () => {
    await expect(
      readOptionalJsonBody(
        jsonRequest(JSON.stringify({ amount: 10, name: 'actual' }), {
          'content-type': 'text/plain',
        }),
        PayloadSchema,
        fallback,
      ),
    ).rejects.toBeInstanceOf(UnsupportedJsonMediaTypeError);
  });

  it('does not hide schema errors behind fallback', async () => {
    await expect(
      readOptionalJsonBody(
        jsonRequest(JSON.stringify({ amount: -1, name: '' })),
        PayloadSchema,
        fallback,
      ),
    ).rejects.toBeInstanceOf(z.ZodError);
  });
});
