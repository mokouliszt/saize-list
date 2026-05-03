import { Preferences } from '@capacitor/preferences';
import type { SaizeriyaJsonRoot, MenuItemDto } from '../models/types';

const GITHUB_URL      = 'https://raw.githubusercontent.com/ryohidaka/saizeriya-menus/main/saizeriya.json';
const PREF_LAST_CHECK = 'last_remote_check_date';

const REQUIRED_FIELDS: (keyof MenuItemDto)[] = [
  'id', 'name', 'name_en', 'name_zh', 'price_with_tax', 'genre', 'is_alcohol', 'icon',
];

export async function shouldCheckToday(): Promise<boolean> {
  const { value } = await Preferences.get({ key: PREF_LAST_CHECK });
  if (!value) return true;
  return new Date(value).toDateString() !== new Date().toDateString();
}

export async function markCheckedToday(): Promise<void> {
  await Preferences.set({ key: PREF_LAST_CHECK, value: new Date().toISOString() });
}

function validateJson(data: any): data is SaizeriyaJsonRoot {
  if (!data?.menus || !Array.isArray(data.menus) || data.menus.length === 0) return false;
  if (typeof data.last_updated !== 'string') return false;
  for (const item of (data.menus as any[]).slice(0, 5)) {
    for (const field of REQUIRED_FIELDS) {
      if (item[field] == null) return false;
    }
  }
  return true;
}

export async function fetchAndValidateRemoteJson(): Promise<SaizeriyaJsonRoot | null> {
  try {
    const res = await fetch(GITHUB_URL, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return validateJson(data) ? data : null;
  } catch {
    return null;
  }
}
