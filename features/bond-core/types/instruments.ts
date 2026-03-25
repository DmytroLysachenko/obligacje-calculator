import { z } from 'zod';

export enum InstrumentType {
  BOND = 'bond',
  STOCK = 'stock',
  COMMODITY = 'commodity',
  CRYPTO = 'crypto',
  CASH = 'cash',
}

/**
 * Metadata for any financial instrument.
 */
export const InstrumentMetadataSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(InstrumentType),
  symbol: z.string(),
  name: z.object({
    en: z.string(),
    pl: z.string(),
  }),
  currency: z.string().default('PLN'),
  color: z.string().optional(),
});

export type InstrumentMetadata = z.infer<typeof InstrumentMetadataSchema>;

/**
 * Base schema for any instrument-specific inputs.
 */
export const BaseInstrumentInputsSchema = z.object({
  initialInvestment: z.number().min(0),
  purchaseDate: z.string(),
  withdrawalDate: z.string(),
});

export type BaseInstrumentInputs = z.infer<typeof BaseInstrumentInputsSchema>;
