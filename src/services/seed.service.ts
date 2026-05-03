import { Preferences }  from '@capacitor/preferences';
import { MENU_VERSION }  from '../config/menuVersion';
import type { SaizeriyaJsonRoot } from '../models/types';
import { dbService }     from './db.service';

const PREF_SEEDED_VER = 'seeded_version_v3';

/**
 * バンドルデータで DB を初期化します。
 * storedVer >= MENU_VERSION の場合はスキップ（リモート更新済みデータを上書きしない）。
 */
export async function seedIfNeeded(): Promise<boolean> {
  const { value: storedVer } = await Preferences.get({ key: PREF_SEEDED_VER });
  if (storedVer && storedVer >= MENU_VERSION) return false;

  const res = await fetch('/data/saizeriya.json');
  if (!res.ok) throw new Error(`メニューデータの読み込みに失敗しました (${res.status})`);
  const root: SaizeriyaJsonRoot = await res.json();

  await applyJsonToDb(root);
  await Preferences.set({ key: PREF_SEEDED_VER, value: MENU_VERSION });
  return true;
}

/** SaizeriyaJsonRoot を DB に適用します（ジャンル upsert → 公式メニュー差し替え）。 */
export async function applyJsonToDb(root: SaizeriyaJsonRoot): Promise<void> {
  const existing = await dbService.getAllGenres();
  const genreMap  = new Map(existing.map(g => [g.name, g.id]));

  const uniqueGenres = [...new Set(root.menus.map(m => m.genre))];
  for (const name of uniqueGenres) {
    if (!genreMap.has(name)) {
      const id = await dbService.addGenre(name);
      if (id > 0) genreMap.set(name, id);
    }
  }

  await dbService.replaceOfficialMenus(root.menus, genreMap);
}

export async function getCurrentDbVersion(): Promise<string> {
  const { value } = await Preferences.get({ key: PREF_SEEDED_VER });
  return value ?? '';
}

export async function setDbVersion(version: string): Promise<void> {
  await Preferences.set({ key: PREF_SEEDED_VER, value: version });
}

export function getBundledVersion(): string {
  return MENU_VERSION;
}
