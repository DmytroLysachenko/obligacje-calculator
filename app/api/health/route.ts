import { rawJson } from '@/lib/server/http/responses';
import { createHealthPayload } from '@/lib/server/health/service';

export function GET() {
  return rawJson(createHealthPayload());
}
