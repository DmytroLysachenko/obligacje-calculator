import { BondType } from '@/features/bond-core/types';
import { SavedScenarioRecord, loadSavedScenarios } from '@/features/single-calculator/lib/scenario-storage';

const STORAGE_KEY = 'obligacje.user-experience.v1';

export interface NotificationPreferences {
  maturity7Days: boolean;
  maturity30Days: boolean;
  inflationUpdate: boolean;
  newBondRelease: boolean;
  taxLimitWarning: boolean;
  staleScenario: boolean;
}

export interface DashboardPreferences {
  defaultCalculator: string;
  inflationView: 'nominal' | 'real';
  favoriteBonds: BondType[];
  chartType: 'area' | 'line';
}

export interface UserExperienceState {
  lastVisitAt: string | null;
  lastViewedScenarioId: string | null;
  readNotificationIds: string[];
  notificationPreferences: NotificationPreferences;
  dashboardPreferences: DashboardPreferences;
}

export interface DashboardNotification {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'action';
  href?: string;
}

export interface PortfolioEventCandidate {
  bondType: string;
  date: string;
  label: string;
  amount: number;
}

const DEFAULT_STATE: UserExperienceState = {
  lastVisitAt: null,
  lastViewedScenarioId: null,
  readNotificationIds: [],
  notificationPreferences: {
    maturity7Days: true,
    maturity30Days: true,
    inflationUpdate: true,
    newBondRelease: false,
    taxLimitWarning: true,
    staleScenario: true,
  },
  dashboardPreferences: {
    defaultCalculator: '/single-calculator',
    inflationView: 'real',
    favoriteBonds: [],
    chartType: 'area',
  },
};

export function loadUserExperienceState(): UserExperienceState {
  if (typeof window === 'undefined') {
    return DEFAULT_STATE;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_STATE;
    }

    const parsed = JSON.parse(raw) as Partial<UserExperienceState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      notificationPreferences: {
        ...DEFAULT_STATE.notificationPreferences,
        ...parsed.notificationPreferences,
      },
      dashboardPreferences: {
        ...DEFAULT_STATE.dashboardPreferences,
        ...parsed.dashboardPreferences,
      },
      readNotificationIds: parsed.readNotificationIds ?? [],
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveUserExperienceState(state: UserExperienceState) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function updateUserExperienceState(
  updater: (current: UserExperienceState) => UserExperienceState,
): UserExperienceState {
  const current = loadUserExperienceState();
  const next = updater(current);
  saveUserExperienceState(next);
  return next;
}

export function markNotificationsRead(ids: string[]) {
  return updateUserExperienceState((current) => ({
    ...current,
    readNotificationIds: Array.from(new Set([...current.readNotificationIds, ...ids])),
  }));
}

export function setLastViewedScenario(scenarioId: string | null) {
  return updateUserExperienceState((current) => ({
    ...current,
    lastViewedScenarioId: scenarioId,
  }));
}

export function setLastVisitNow() {
  return updateUserExperienceState((current) => ({
    ...current,
    lastVisitAt: new Date().toISOString(),
  }));
}

export function toggleFavoriteBond(bondType: BondType) {
  return updateUserExperienceState((current) => {
    const exists = current.dashboardPreferences.favoriteBonds.includes(bondType);
    return {
      ...current,
      dashboardPreferences: {
        ...current.dashboardPreferences,
        favoriteBonds: exists
          ? current.dashboardPreferences.favoriteBonds.filter((item) => item !== bondType)
          : [...current.dashboardPreferences.favoriteBonds, bondType],
      },
    };
  });
}

export function updateNotificationPreference(
  key: keyof NotificationPreferences,
  value: boolean,
) {
  return updateUserExperienceState((current) => ({
    ...current,
    notificationPreferences: {
      ...current.notificationPreferences,
      [key]: value,
    },
  }));
}

export function buildDashboardNotifications(
  events: PortfolioEventCandidate[],
  experience: UserExperienceState,
  scenarios: SavedScenarioRecord[] = loadSavedScenarios(),
): DashboardNotification[] {
  const now = new Date();
  const in7Days = now.getTime() + 7 * 24 * 60 * 60 * 1000;
  const in30Days = now.getTime() + 30 * 24 * 60 * 60 * 1000;

  const notifications: DashboardNotification[] = [];

  if (experience.notificationPreferences.maturity7Days) {
    const urgent = events.find((event) => {
      const time = new Date(event.date).getTime();
      return time >= now.getTime() && time <= in7Days;
    });

    if (urgent) {
      notifications.push({
        id: `maturity-7-${urgent.bondType}-${urgent.date}`,
        title: 'Maturity approaching in 7 days',
        description: `${urgent.bondType} ${urgent.label.toLowerCase()} due on ${urgent.date}.`,
        severity: 'action',
        href: '/notebook',
      });
    }
  }

  if (experience.notificationPreferences.maturity30Days) {
    const soon = events.find((event) => {
      const time = new Date(event.date).getTime();
      return time > in7Days && time <= in30Days;
    });

    if (soon) {
      notifications.push({
        id: `maturity-30-${soon.bondType}-${soon.date}`,
        title: 'Upcoming portfolio event',
        description: `${soon.bondType} ${soon.label.toLowerCase()} lands within 30 days.`,
        severity: 'info',
        href: '/notebook',
      });
    }
  }

  if (experience.notificationPreferences.staleScenario) {
    const stale = scenarios.find((scenario) => {
      const age = now.getTime() - new Date(scenario.updatedAt).getTime();
      return age > 14 * 24 * 60 * 60 * 1000;
    });

    if (stale) {
      notifications.push({
        id: `stale-scenario-${stale.id}`,
        title: 'Saved scenario may be stale',
        description: `${stale.name} has not been refreshed for more than 14 days.`,
        severity: 'info',
        href: '/single-calculator',
      });
    }
  }

  if (experience.notificationPreferences.inflationUpdate) {
    notifications.push({
      id: 'inflation-update-snapshot',
      title: 'Inflation assumptions deserve a quick check',
      description: 'Review your saved scenarios after each macro data refresh.',
      severity: 'info',
      href: '/economic-data',
    });
  }

  return notifications.filter((notification) => !experience.readNotificationIds.includes(notification.id));
}
