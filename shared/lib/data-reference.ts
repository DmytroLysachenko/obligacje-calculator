export interface DataReferenceMetaLike {
  source?: string;
  usedFallback?: boolean;
  asOf?: string;
  lastCheck?: string;
  coverageStart?: string;
  coverageEnd?: string;
  dataSource?: string;
  syncStatus?: 'success' | 'partial' | 'failed' | 'stale';
  coverageNote?: string;
  sourceUrl?: string;
}

type AppLanguage = 'pl' | 'en';
export type ReferenceMetaItem = {
  label: string;
  value: string;
};

const REFERENCE_COPY = {
  unavailable: {
    pl: 'Niedostepne',
    en: 'Unavailable',
  },
  syncedDataset: {
    pl: 'Zsynchronizowany zestaw danych',
    en: 'Synced dataset',
  },
  fallbackDataset: {
    pl: 'Zapasowy zestaw danych',
    en: 'Fallback dataset',
  },
  officialNbp: {
    pl: 'Oficjalne API NBP',
    en: 'Official NBP API',
  },
  officialBondSite: {
    pl: 'Oficjalna oferta obligacji',
    en: 'Official bond offer site',
  },
  officialGusPartial: {
    pl: 'GUS / czesciowy zakres referencyjny',
    en: 'GUS / partial reference coverage',
  },
  staleDataset: {
    pl: 'Zsynchronizowany, ale przeterminowany zakres',
    en: 'Synced but stale coverage',
  },
  coverageUnavailable: {
    pl: 'Zakres niedostepny',
    en: 'Coverage not available',
  },
  scopeUnknown: {
    pl: 'Zakres nieznany',
    en: 'Scope unknown',
  },
  referenceOnly: {
    pl: 'Tylko odczyt referencyjny',
    en: 'Reference reading only',
  },
  supportsContext: {
    pl: 'Wspiera kontekst kalkulatora',
    en: 'Supports calculator context',
  },
  unavailableTitle: {
    pl: 'Brak metadanych',
    en: 'Unavailable metadata',
  },
  unavailableDescription: {
    pl: 'Ta strona nie ma jeszcze wystarczajacych metadanych synchronizacji, aby opisac swiezosc lub zakres.',
    en: 'This page does not have enough sync metadata to describe freshness or coverage yet.',
  },
  fallbackTitle: {
    pl: 'Zastepczy lub czesciowy zakres',
    en: 'Fallback or partial coverage',
  },
  fallbackDescription: {
    pl: 'Traktuj te serie jako wsparcie referencyjne, dopoki pipeline synchronizacji nie przywroci pelniejszego zakresu.',
    en: 'Treat this series as reference support until the sync pipeline restores fuller coverage.',
  },
  staleTitle: {
    pl: 'Zakres wymaga odswiezenia',
    en: 'Coverage needs refresh',
  },
  staleDescription: {
    pl: 'Dane pochodza z poprawnego zrodla, ale ich okno czasowe nie jest juz wystarczajaco aktualne dla biezacego odczytu.',
    en: 'The data comes from a valid source, but its coverage window is no longer fresh enough for current reading.',
  },
  syncedTitle: {
    pl: 'Zsynchronizowany zakres referencyjny',
    en: 'Synced reference coverage',
  },
  syncedDescription: {
    pl: 'Ta seria jest wsparta zsynchronizowanym pipeline danych i moze sluzyc do interpretacji kalkulatora.',
    en: 'This series is backed by the synced data pipeline and can support calculator interpretation.',
  },
} as const;

function getReferenceCopy(
  key: keyof typeof REFERENCE_COPY,
  language: AppLanguage,
) {
  return REFERENCE_COPY[key][language];
}

function getKnownDataSourceLabel(
  value: string,
  language: AppLanguage,
) {
  const normalized = value.trim().toLowerCase();

  if (normalized === 'static fallback dataset') {
    return getReferenceCopy('fallbackDataset', language);
  }

  if (normalized === 'database') {
    return getReferenceCopy('syncedDataset', language);
  }

  if (normalized === 'nbp official api') {
    return getReferenceCopy('officialNbp', language);
  }

  if (
    normalized === 'gus / partial seeded coverage'
    || normalized === 'gus/partial seeded coverage'
    || normalized === 'gus / partial reference coverage'
  ) {
    return getReferenceCopy('officialGusPartial', language);
  }

  if (
    normalized === 'official bond offer page'
    || normalized === 'official bond offer communication'
  ) {
    return getReferenceCopy('officialBondSite', language);
  }

  return value;
}

function getCoverageNoteLabel(
  value: string,
  language: AppLanguage,
) {
  const normalized = value.trim().toLowerCase();

  if (normalized === 'cpi-partial-reference') {
    return language === 'pl'
      ? 'Miesieczny CPI nadal ma tylko czesciowy zakres referencyjny. Nie czytaj go jako w pelni aktualnych danych rynkowych.'
      : 'Monthly CPI still has only partial reference coverage. Do not read it as fully current market data.';
  }

  if (normalized === 'cpi-stale-coverage') {
    return language === 'pl'
      ? 'Zrodlo CPI jest poprawne, ale ostatni zaimportowany punkt jest zbyt stary, aby traktowac ten zakres jako biezacy.'
      : 'The CPI source is valid, but the latest imported point is too old to treat this coverage as current.';
  }

  if (normalized === 'reference-synced-context') {
    return language === 'pl'
      ? 'Zakres jest wystarczajaco aktualny, aby spokojnie wspierac odczyt kalkulatora.'
      : 'Coverage is current enough to calmly support calculator reading.';
  }

  if (normalized === 'nbp-fallback-reference') {
    return language === 'pl'
      ? 'Historia stopy referencyjnej pozostaje zastepcza. Czytaj ja tylko jako kontekst referencyjny.'
      : 'Reference-rate history remains fallback-based. Read it only as reference context.';
  }

  if (normalized === 'nbp-synced-context') {
    return language === 'pl'
      ? 'Historia stopy referencyjnej jest zsynchronizowana i moze wspierac odczyt wynikow obligacji.'
      : 'Reference-rate history is synced and can support reading bond results.';
  }

  return value;
}

export function getReferenceSourceLabel(
  meta?: DataReferenceMetaLike,
  language: AppLanguage = 'en',
) {
  if (!meta) {
    return getReferenceCopy('unavailable', language);
  }

  if (meta.dataSource) {
    return getKnownDataSourceLabel(meta.dataSource, language);
  }

  if (meta.source === 'database') {
    return getReferenceCopy('syncedDataset', language);
  }

  if (meta.source === 'fallback') {
    return getReferenceCopy('fallbackDataset', language);
  }

  return getReferenceCopy('unavailable', language);
}

export function getReferenceCoverageLabel(
  meta?: DataReferenceMetaLike,
  language: AppLanguage = 'en',
) {
  if (!meta?.coverageStart || !meta?.coverageEnd) {
    return getReferenceCopy('coverageUnavailable', language);
  }

  return `${meta.coverageStart} - ${meta.coverageEnd}`;
}

export function getReferenceAsOfLabel(
  meta?: DataReferenceMetaLike,
  language: AppLanguage = 'en',
) {
  return meta?.asOf ?? meta?.lastCheck ?? getReferenceCopy('unavailable', language);
}

export function getReferenceScopeLabel(
  meta?: DataReferenceMetaLike,
  language: AppLanguage = 'en',
) {
  if (!meta) {
    return getReferenceCopy('scopeUnknown', language);
  }

  if (meta.usedFallback || meta.source === 'fallback') {
    return getReferenceCopy('referenceOnly', language);
  }

  if (meta.syncStatus === 'partial' || meta.syncStatus === 'stale') {
    return getReferenceCopy('referenceOnly', language);
  }

  return getReferenceCopy('supportsContext', language);
}

export function getReferenceState(
  meta?: DataReferenceMetaLike,
  language: AppLanguage = 'en',
) {
  if (!meta) {
    return {
      title: getReferenceCopy('unavailableTitle', language),
      description: getReferenceCopy('unavailableDescription', language),
      tone: 'warning' as const,
    };
  }

  if (meta.syncStatus === 'stale') {
    return {
      title: getReferenceCopy('staleTitle', language),
      description: meta.coverageNote
        ? getCoverageNoteLabel(meta.coverageNote, language)
        : getReferenceCopy('staleDescription', language),
      tone: 'warning' as const,
    };
  }

  if (meta.usedFallback || meta.source === 'fallback' || meta.syncStatus === 'failed' || meta.syncStatus === 'partial') {
    return {
      title: getReferenceCopy('fallbackTitle', language),
      description: meta.coverageNote
        ? getCoverageNoteLabel(meta.coverageNote, language)
        : getReferenceCopy('fallbackDescription', language),
      tone: 'warning' as const,
    };
  }

  return {
    title: getReferenceCopy('syncedTitle', language),
    description: getReferenceCopy('syncedDescription', language),
    tone: 'good' as const,
  };
}

export function getReferenceMetaItems(
  meta: DataReferenceMetaLike | undefined,
  language: AppLanguage = 'en',
): ReferenceMetaItem[] {
  return [
    {
      label: language === 'pl' ? 'Zrodlo' : 'Source',
      value: getReferenceSourceLabel(meta, language),
    },
    {
      label: language === 'pl' ? 'Stan na' : 'As of',
      value: getReferenceAsOfLabel(meta, language),
    },
    {
      label: language === 'pl' ? 'Zakres' : 'Coverage',
      value: getReferenceCoverageLabel(meta, language),
    },
    {
      label: language === 'pl' ? 'Uzycie' : 'Use',
      value: getReferenceScopeLabel(meta, language),
    },
  ];
}

