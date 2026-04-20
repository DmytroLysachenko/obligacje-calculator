export interface GlossaryEntry {
  term: string;
  definition: {
    pl: string;
    en: string;
  };
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  SAVINGS_GOAL: {
    term: 'Savings Goal',
    definition: {
      pl: 'Kwota, którą chcesz zgromadzić na koniec inwestycji. Kalkulator pomoże wyliczyć, ile musisz wpłacić dzisiaj, aby osiągnąć ten cel.',
      en: 'The amount you want to accumulate by the end of your investment. The calculator helps determine how much you need to invest today to reach this goal.'
    }
  },
  BELKA_TAX: {
    term: 'Belka Tax',
    definition: {
      pl: 'Zryczałtowany podatek dochodowy od zysków kapitałowych w wysokości 19%. Pobierany automatycznie przy wypłacie odsetek.',
      en: 'A 19% flat-rate income tax on capital gains in Poland. It is automatically withheld when interest is paid out.'
    }
  },
  CAPITALIZATION: {
    term: 'Capitalization',
    definition: {
      pl: 'Proces dopisywania wypracowanych odsetek do kapitału, dzięki czemu w kolejnym okresie odsetki naliczane są od większej kwoty (procent składany).',
      en: 'The process of adding earned interest to the principal, so that in the next period, interest is calculated on a larger amount (compound interest).'
    }
  },
  INFLATION_INDEXED: {
    term: 'Inflation-indexed',
    definition: {
      pl: 'Obligacje, których oprocentowanie zmienia się co roku w oparciu o wskaźnik inflacji powiększony o stałą marżę (np. COI, EDO).',
      en: 'Bonds whose interest rate changes every year based on the inflation rate plus a fixed margin (e.g., COI, EDO).'
    }
  },
  REAL_VALUE: {
    term: 'Real Value',
    definition: {
      pl: 'Wartość Twojego kapitału skorygowana o inflację (siła nabywcza). Pokazuje, ile dzisiejszych towarów będziesz mógł kupić za te pieniądze w przyszłości.',
      en: 'The value of your capital adjusted for inflation (purchasing power). It shows how many today\'s goods you will be able to buy with that money in the future.'
    }
  },
  EARLY_WITHDRAWAL: {
    term: 'Early Withdrawal Fee',
    definition: {
      pl: 'Opłata za wcześniejsze wycofanie środków przed terminem zapadalności. Jest odejmowana od narosłych odsetek, nigdy od kapitału głównego.',
      en: 'A fee for withdrawing funds before the maturity date. It is deducted from the accrued interest, never from the principal capital.'
    }
  },
  TAX_WRAPPER: {
    term: 'Tax Wrapper (IKE/IKZE)',
    definition: {
      pl: 'Specjalne konta emerytalne pozwalające na uniknięcie podatku Belka przy zachowaniu określonych warunków (np. wiek 60 lat dla IKE).',
      en: 'Special retirement accounts that allow you to avoid Belka tax if certain conditions are met (e.g., reaching age 60 for IKE).'
    }
  }
};
