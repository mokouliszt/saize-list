import { create }        from 'zustand';
import { Clipboard }     from '@capacitor/clipboard';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor }     from '@capacitor/core';
import { Preferences }   from '@capacitor/preferences';
import { dbService }     from '../services/db.service';
import {
  seedIfNeeded, applyJsonToDb,
  getCurrentDbVersion, setDbVersion, getBundledVersion,
} from '../services/seed.service';
import {
  shouldCheckToday, markCheckedToday, fetchAndValidateRemoteJson,
} from '../services/remote-update.service';
import type { MenuItem, Genre, SortOrder, Language } from '../models/types';
import { getDisplayName } from '../models/types';

interface MenuStore {
  // ── State ──────────────────────────────────────────────────────────────────
  items: MenuItem[];
  genres: Genre[];
  searchQuery: string;
  selectedGenreId: number | null;
  sortOrder: SortOrder;
  isLoading: boolean;
  splashStatus: string;
  toast: { message: string; color?: string } | null;
  dataVersion: string;
  language: Language;

  // ── Computed ───────────────────────────────────────────────────────────────
  filteredItems: () => MenuItem[];
  getItemById: (id: number) => MenuItem | undefined;

  // ── ライフサイクル ─────────────────────────────────────────────────────────
  init: () => Promise<void>;

  // ── フィルター・ソート ──────────────────────────────────────────────────────
  setSearchQuery: (q: string) => void;
  setSelectedGenre: (id: number | null) => void;
  setSortOrder: (order: SortOrder) => void;

  // ── アイテム操作 ────────────────────────────────────────────────────────────
  addItem: (item: Omit<MenuItem, 'id' | 'isUserAdded'>, customId?: number) => Promise<void>;
  updateItem: (item: MenuItem) => Promise<void>;
  setItemGenres: (id: number, genreId: number | null, genreId2: number | null) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;

  // ── ジャンル操作 ────────────────────────────────────────────────────────────
  addGenre: (name: string, colorHex?: string) => Promise<number>;
  deleteGenre: (id: number) => Promise<void>;

  // ── カスタムデータリセット ──────────────────────────────────────────────────
  resetUserData: () => Promise<void>;

  // ── リモート更新 ───────────────────────────────────────────────────────────
  checkRemoteUpdate: () => Promise<void>;

  // ── クリップボード ──────────────────────────────────────────────────────────
  copyOrderNumber: (id: number) => Promise<void>;

  // ── 言語 ────────────────────────────────────────────────────────────────────
  setLanguage: (lang: Language) => Promise<void>;

  // ── Toast ──────────────────────────────────────────────────────────────────
  showToast: (message: string, color?: string) => void;
  clearToast: () => void;
}

export const useMenuStore = create<MenuStore>((set, get) => ({
  items: [],
  genres: [],
  searchQuery: '',
  selectedGenreId: null,
  sortOrder: 'id_asc',
  isLoading: false,
  splashStatus: '',
  toast: null,
  dataVersion: getBundledVersion(),
  language: 'ja' as Language,

  // ── Computed ───────────────────────────────────────────────────────────────
  filteredItems: () => {
    const { items, searchQuery, selectedGenreId, sortOrder, language } = get();
    let result = items;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        i => getDisplayName(i, language).toLowerCase().includes(q) || String(i.id).includes(q)
      );
    }
    if (selectedGenreId !== null) {
      result = result.filter(i => i.genreId === selectedGenreId || i.genreId2 === selectedGenreId);
    }
    return [...result].sort((a, b) => {
      switch (sortOrder) {
        case 'price_asc':  return a.price - b.price;
        case 'price_desc': return b.price - a.price;
        case 'kana_asc':   return a.sortKana.localeCompare(b.sortKana, 'ja');
        case 'kana_desc':  return b.sortKana.localeCompare(a.sortKana, 'ja');
        default:           return a.id - b.id;
      }
    });
  },

  getItemById: (id) => get().items.find(i => i.id === id),

  // ── 初期化 ──────────────────────────────────────────────────────────────────
  init: async () => {
    set({ isLoading: true, splashStatus: 'メニューバージョン確認中...' });
    try {
      await dbService.init();
      await seedIfNeeded();

      // 1日1回リモートバージョンチェック
      if (await shouldCheckToday()) {
        const remoteJson = await fetchAndValidateRemoteJson();
        await markCheckedToday();

        if (remoteJson) {
          const currentVer = await getCurrentDbVersion();
          if (remoteJson.last_updated > currentVer) {
            set({ splashStatus: 'プロファイルダウンロード中...' });
            await applyJsonToDb(remoteJson);
            await setDbVersion(remoteJson.last_updated);
          }
        }
      }

      const [items, genres, { value: savedLang }] = await Promise.all([
        dbService.getAllMenuItems(),
        dbService.getAllGenres(),
        Preferences.get({ key: 'app_language' }),
      ]);
      const dataVersion = await getCurrentDbVersion();
      set({
        items, genres, dataVersion,
        ...(savedLang ? { language: savedLang as Language } : {}),
      });
    } catch (e: any) {
      console.error('[menuStore] init error:', e);
      get().showToast('データの読み込みに失敗しました', 'danger');
    } finally {
      set({ isLoading: false, splashStatus: '' });
    }
  },

  // ── フィルター・ソート ──────────────────────────────────────────────────────
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSelectedGenre: (id) => set({ selectedGenreId: id }),
  setSortOrder: (order) => set({ sortOrder: order }),

  // ── アイテム操作 ────────────────────────────────────────────────────────────
  addItem: async (item, customId) => {
    const id = await dbService.addUserItem({ ...item, isUserAdded: true }, customId);
    set(s => ({ items: [...s.items, { ...item, id, isUserAdded: true }] }));
    get().showToast('メニューを追加しました ✓');
  },

  updateItem: async (item) => {
    await dbService.updateUserItem(item);
    set(s => ({ items: s.items.map(i => i.id === item.id ? item : i) }));
    get().showToast('更新しました ✓');
  },

  setItemGenres: async (id: number, genreId: number | null, genreId2: number | null) => {
    await dbService.updateItemGenres(id, genreId, genreId2);
    set(s => ({ items: s.items.map(i => i.id === id
      ? { ...i, genreId: genreId ?? 0, genreId2: genreId2 ?? undefined }
      : i
    ) }));
    get().showToast('ジャンルを更新しました ✓');
  },

  deleteItem: async (id) => {
    await dbService.deleteUserItem(id);
    set(s => ({ items: s.items.filter(i => i.id !== id) }));
    get().showToast('削除しました');
  },

  // ── ジャンル操作 ────────────────────────────────────────────────────────────
  addGenre: async (name, colorHex = '#FF6B35') => {
    const id = await dbService.addGenre(name, colorHex, true);
    if (id > 0) {
      set(s => ({ genres: [...s.genres, { id, name, isUserCreated: true, colorHex: colorHex! }] }));
    }
    return id;
  },

  deleteGenre: async (id) => {
    await dbService.deleteGenre(id);
    set(s => ({
      genres: s.genres.filter(g => g.id !== id),
      items:  s.items.map(i => ({
        ...i,
        genreId:  i.genreId  === id ? 0         : i.genreId,
        genreId2: i.genreId2 === id ? undefined  : i.genreId2,
      })),
      selectedGenreId: s.selectedGenreId === id ? null : s.selectedGenreId,
    }));
  },

  // ── カスタムデータリセット ──────────────────────────────────────────────────
  resetUserData: async () => {
    await dbService.resetUserData();
    const [items, genres] = await Promise.all([
      dbService.getAllMenuItems(),
      dbService.getAllGenres(),
    ]);
    set({ items, genres, selectedGenreId: null });
    get().showToast('カスタムデータをリセットしました', 'success');
  },

  // ── リモート更新 ───────────────────────────────────────────────────────────
  checkRemoteUpdate: async () => {
    get().showToast('メニューバージョン確認中...', 'dark');
    try {
      const remoteJson = await fetchAndValidateRemoteJson();
      if (!remoteJson) {
        get().showToast('更新の確認に失敗しました', 'danger');
        return;
      }

      const currentVer = await getCurrentDbVersion();
      await markCheckedToday();

      if (remoteJson.last_updated <= currentVer) {
        get().showToast('すでに最新のメニューデータです', 'success');
        return;
      }

      get().showToast('プロファイルダウンロード中...', 'dark');
      await applyJsonToDb(remoteJson);
      await setDbVersion(remoteJson.last_updated);

      const [items, genres] = await Promise.all([
        dbService.getAllMenuItems(),
        dbService.getAllGenres(),
      ]);
      set({ items, genres, dataVersion: remoteJson.last_updated });
      get().showToast('メニューを更新しました ✓', 'success');
    } catch (e: any) {
      console.error('[menuStore] checkRemoteUpdate error:', e);
      get().showToast('更新中にエラーが発生しました', 'danger');
    }
  },

  // ── クリップボード ──────────────────────────────────────────────────────────
  copyOrderNumber: async (id) => {
    await Clipboard.write({ string: String(id) });
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
    get().showToast(`"${id}" をコピーしました`, 'success');
  },

  // ── 言語 ────────────────────────────────────────────────────────────────────
  setLanguage: async (lang) => {
    await Preferences.set({ key: 'app_language', value: lang });
    set({ language: lang });
  },

  // ── Toast ──────────────────────────────────────────────────────────────────
  showToast: (message, color = 'dark') => set({ toast: { message, color } }),
  clearToast: () => set({ toast: null }),
}));
