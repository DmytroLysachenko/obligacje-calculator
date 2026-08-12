import { z } from 'zod';

import { BondInputsSchema } from '@/features/bond-core/types/schemas';

/** Public shares are intentionally small, finite-lived snapshots—not generic storage. */
export const SHARED_SCENARIO_LIMITS = {
  descriptionLength: 1_000,
} as const;

export const SharedScenarioPayloadSchema = z
  .object({
    inputs: BondInputsSchema,
    description: z.string().trim().max(SHARED_SCENARIO_LIMITS.descriptionLength).optional(),
  })
  .strict();

type SharedScenarioPayloadCommand = z.infer<typeof SharedScenarioPayloadSchema>;
