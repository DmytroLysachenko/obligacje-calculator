import {
  createUserSettings,
  findUserSettingsByOwner,
  updateUserSettingsByOwner,
  type UserSettingsRecord,
} from './repository';

export async function getOwnerSettings(ownerId: string) {
  const settings = await findUserSettingsByOwner(ownerId);

  if (settings) {
    return settings;
  }

  return {
    id: '',
    userId: ownerId,
    currency: 'PLN',
    theme: 'system',
    defaultInflationScenario: 'base',
    chartType: 'area',
    updatedAt: new Date(),
  } as UserSettingsRecord;
}

export async function updateOwnerSettings(
  ownerId: string,
  input: {
    currency?: string;
    theme?: string;
    defaultInflationScenario?: string;
    chartType?: string;
  },
) {
  const existing = await findUserSettingsByOwner(ownerId);

  if (existing) {
    return updateUserSettingsByOwner(ownerId, input);
  }

  return createUserSettings(ownerId, input);
}
