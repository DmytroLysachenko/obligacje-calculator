export interface DataReferenceMetaLike {
  source?: string;
  usedFallback?: boolean;
  asOf?: string;
  lastCheck?: string;
  coverageStart?: string;
  coverageEnd?: string;
  dataSource?: string;
}

export function getReferenceSourceLabel(meta?: DataReferenceMetaLike) {
  if (!meta) {
    return 'Unavailable';
  }

  if (meta.dataSource) {
    return meta.dataSource;
  }

  if (meta.source === 'database') {
    return 'database sync';
  }

  if (meta.source === 'fallback') {
    return 'fallback dataset';
  }

  return 'Unavailable';
}

export function getReferenceCoverageLabel(meta?: DataReferenceMetaLike) {
  if (!meta?.coverageStart || !meta?.coverageEnd) {
    return 'Coverage not available';
  }

  return `${meta.coverageStart} - ${meta.coverageEnd}`;
}

export function getReferenceAsOfLabel(meta?: DataReferenceMetaLike) {
  return meta?.asOf ?? meta?.lastCheck ?? 'Unavailable';
}

export function getReferenceState(meta?: DataReferenceMetaLike) {
  if (!meta) {
    return {
      title: 'Unavailable metadata',
      description:
        'This page does not have enough sync metadata to describe freshness or coverage yet.',
      tone: 'warning' as const,
    };
  }

  if (meta.usedFallback || meta.source === 'fallback') {
    return {
      title: 'Fallback or partial data',
      description:
        'Treat this series as reference context only until the sync pipeline restores fuller coverage.',
      tone: 'warning' as const,
    };
  }

  return {
    title: 'Database-backed data',
    description:
      'This series is backed by the synced data pipeline and can be used as current calculator context.',
    tone: 'good' as const,
  };
}
