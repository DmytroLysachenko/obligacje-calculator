export interface DataReferenceMetaLike {
  source?: string;
  usedFallback?: boolean;
  asOf?: string;
  lastCheck?: string;
  coverageStart?: string;
  coverageEnd?: string;
  dataSource?: string;
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

  if (meta.usedFallback || meta.source === 'fallback') {
    return {
      title: getReferenceCopy('fallbackTitle', language),
      description: getReferenceCopy('fallbackDescription', language),
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

