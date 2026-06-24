import { createHealthPayload } from '@/lib/server/health/service';
import { rawJson } from '@/lib/server/http/responses';

export function GET() {
  return rawJson(createHealthPayload());
}
