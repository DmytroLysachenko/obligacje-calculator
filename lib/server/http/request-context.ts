import { NextRequest, NextResponse } from 'next/server';

const REQUEST_ID_HEADER = 'x-request-id';
const SAFE_REQUEST_ID = /^[A-Za-z0-9_-]{8,128}$/;

export function getRequestId(request: NextRequest): string {
  const supplied = request.headers.get(REQUEST_ID_HEADER);
  if (supplied && SAFE_REQUEST_ID.test(supplied)) return supplied;
  return crypto.randomUUID();
}

export function withRequestId(response: NextResponse, requestId: string) {
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

export function addRequestIdToProblem<T extends object>(problem: T, requestId: string): T & { requestId: string } {
  return { ...problem, requestId };
}
