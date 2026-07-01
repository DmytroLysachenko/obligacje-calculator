import { z } from 'zod';

/**
 * Base schema for any instrument-specific inputs.
 */
export const BaseInstrumentInputsSchema = z.object({
  initialInvestment: z.number().min(0),
  purchaseDate: z.string(),
  withdrawalDate: z.string(),
});
