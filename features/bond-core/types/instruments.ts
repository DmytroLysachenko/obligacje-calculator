import { z } from 'zod';

import { IsoCalendarDateSchema } from './iso-calendar-date';

/**
 * Base schema for any instrument-specific inputs.
 */
export const BaseInstrumentInputsSchema = z.object({
  initialInvestment: z.number().min(0),
  purchaseDate: IsoCalendarDateSchema,
  withdrawalDate: IsoCalendarDateSchema,
});
