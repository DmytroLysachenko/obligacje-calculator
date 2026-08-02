export const WEB_VITAL_SAMPLE_RATE = 0.1;

export interface BrowserPrivacySignals {
  doNotTrack?: string | null;
  globalPrivacyControl?: boolean;
}

/** Browser telemetry is strictly opt-out and sampled before any network work. */
export function shouldReportWebVital(
  privacy: BrowserPrivacySignals,
  random = Math.random(),
  sampleRate = WEB_VITAL_SAMPLE_RATE,
) {
  if (privacy.globalPrivacyControl || privacy.doNotTrack === '1' || privacy.doNotTrack === 'yes') {
    return false;
  }

  return random < sampleRate;
}
