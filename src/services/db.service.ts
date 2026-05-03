import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { get, set } from 'idb-keyval';
import type { MenuItem, Genre, MenuItemDto } from '../models/types';

// ─── DDL ────────────────────────────────────────────────────────────────────
const DB_NAME    = 'saizelist.db';
const DB_VERSION = 3;

const DDL = `
CREATE TABLE IF NOT EXISTS genres (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT    NOT NULL UNIQUE,
  is_user_created INTEGER DEFAULT 0,
  color_hex       TEXT    DEFAULT '#1B8B3B'
);

CREATE TABLE IF NOT EXISTS menu_items (
  id            INTEGER PRIMARY KEY,
  name          TEXT    NOT NULL,
  name_en       TEXT    DEFAULT '',
  name_zh       TEXT    DEFAULT '',
  price         INTEGER NOT NULL,   -- 税込価格 (price_with_tax)
  genre_id      INTEGER REFERENCES genres(id),
  genre_id_2    INTEGER REFERENCES genres(id),
  calorie       INTEGER,            -- ※ calorie (s なし)
  salt          REAL,
  icon          TEXT    DEFAULT '',
  is_alcohol    INTEGER DEFAULT 0,
  is_user_added INTEGER DEFAULT 0,
  sort_kana     TEXT    DEFAULT '',
  note          TEXT    DEFAULT ''
);
`;

// ─── 抽象インターフェース ────────────────────────────────────────────────────
interface IDbService {
  init(): Promise<void>;
  getAllMenuItems(): Promise<MenuItem[]>;
  replaceOfficialMenus(dtos: MenuItemDto[], genreMap: Map<string, number>): Promise<void>;
  addUserItem(item: Omit<MenuItem, 'id'>, customId?: number): Promise<number>;
  updateUserItem(item: MenuItem): Promise<void>;
  updateItemGenres(id: number, genreId: number | null, genreId2: number | null): Promise<void>;
  deleteUserItem(id: number): Promise<void>;
  getAllGenres(): Promise<Genre[]>;
  addGenre(name: string, colorHex?: string, isUserCreated?: boolean): Promise<number>;
  deleteGenre(id: number): Promise<void>;
  resetUserData(): Promise<void>;
}

// ─── Native SQLite 実装 ─────────────────────────────────────────────────────
class SQLiteDbService implements IDbService {
  private db: any;
  private sqlite = new SQLiteConnection(CapacitorSQLite);

  async init() {
    const isConn = (await this.sqlite.isConnection(DB_NAME, false)).result;
    this.db = isConn
      ? await this.sqlite.retrieveConnection(DB_NAME, false)
      : await this.sqlite.createConnection(DB_NAME, false, 'no-encryption', DB_VERSION, false);
    await this.db.open();
    await this.db.execute(DDL);
    // genre_id_2 カラムが存在しない旧DBへのマイグレーション
    try {
      await this.db.execute(`ALTER TABLE menu_items ADD COLUMN genre_id_2 INTEGER`);
    } catch (_) { /* already exists */ }
  }

  async getAllMenuItems(): Promise<MenuItem[]> {
    const res = await this.db.query(`
      SELECT m.*, g.name AS genre_name
      FROM   menu_items m
      LEFT JOIN genres g ON m.genre_id = g.id
      ORDER BY m.id ASC
    `);
    return (res.values ?? []).map(rowToMenuItem);
  }

  async replaceOfficialMenus(dtos: MenuItemDto[], genreMap: Map<string, number>): Promise<void> {
    await this.db.execute(`DELETE FROM menu_items WHERE is_user_added = 0`);
    const stmts = dtos.map(dto => ({
      statement: `INSERT INTO menu_items
        (id, name, name_en, name_zh, price, genre_id, calorie, salt, icon, is_alcohol, is_user_added, sort_kana)
        VALUES (?,?,?,?,?,?,?,?,?,?,0,?)`,
      values: [
        dto.id,
        dto.name,
        dto.name_en ?? '',
        dto.name_zh ?? '',
        dto.price_with_tax,
        genreMap.get(dto.genre) ?? null,
        dto.calorie ?? null,
        dto.salt ?? null,
        dto.icon ?? '',
        dto.is_alcohol ? 1 : 0,
        dto.name,
      ],
    }));
    await this.db.executeSet(stmts);
  }

  async addUserItem(item: Omit<MenuItem, 'id'>, customId?: number): Promise<number> {
    let newId: number;
    if (customId !== undefined) {
      newId = customId;
    } else {
      const res = await this.db.query(`SELECT MIN(id) as min_id FROM menu_items WHERE is_user_added = 1`);
      newId = Math.min(res.values?.[0]?.min_id ?? 0, 0) - 1;
    }
    await this.db.run(
      `INSERT INTO menu_items (id,name,name_en,name_zh,price,genre_id,genre_id_2,calorie,salt,icon,is_alcohol,is_user_added,sort_kana,note)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,1,?,?)`,
      [newId, item.name, '', '',
       item.price, item.genreId ?? null, item.genreId2 ?? null,
       item.calorie ?? null, item.salt ?? null,
       item.icon ?? '🍽️', item.isAlcohol ? 1 : 0,
       item.sortKana, item.note]
    );
    return newId;
  }

  async updateUserItem(item: MenuItem): Promise<void> {
    await this.db.run(
      `UPDATE menu_items
       SET name=?,price=?,genre_id=?,genre_id_2=?,calorie=?,salt=?,icon=?,is_alcohol=?,sort_kana=?,note=?
       WHERE id=? AND is_user_added=1`,
      [item.name, item.price, item.genreId ?? null, item.genreId2 ?? null,
       item.calorie ?? null, item.salt ?? null,
       item.icon, item.isAlcohol ? 1 : 0,
       item.sortKana, item.note, item.id]
    );
  }

  async updateItemGenres(id: number, genreId: number | null, genreId2: number | null): Promise<void> {
    await this.db.run(
      `UPDATE menu_items SET genre_id=?, genre_id_2=? WHERE id=?`,
      [genreId, genreId2, id]
    );
  }

  async deleteUserItem(id: number): Promise<void> {
    await this.db.execute(`DELETE FROM menu_items WHERE id=${id} AND is_user_added=1`);
  }

  async getAllGenres(): Promise<Genre[]> {
    const res = await this.db.query(`SELECT * FROM genres ORDER BY id ASC`);
    return (res.values ?? []).map(rowToGenre);
  }

  async addGenre(name: string, colorHex = '#1B8B3B', isUserCreated = false): Promise<number> {
    const res = await this.db.run(
      `INSERT OR IGNORE INTO genres (name, is_user_created, color_hex) VALUES (?,?,?)`,
      [name, isUserCreated ? 1 : 0, colorHex]
    );
    return res.changes?.lastId ?? -1;
  }

  async deleteGenre(id: number): Promise<void> {
    await this.db.execute(`UPDATE menu_items SET genre_id=NULL WHERE genre_id=${id}`);
    await this.db.execute(`UPDATE menu_items SET genre_id_2=NULL WHERE genre_id_2=${id}`);
    await this.db.execute(`DELETE FROM genres WHERE id=${id} AND is_user_created=1`);
  }

  async resetUserData(): Promise<void> {
    await this.db.execute(`DELETE FROM menu_items WHERE is_user_added=1`);
    await this.db.execute(`UPDATE menu_items SET genre_id=NULL WHERE genre_id NOT IN (SELECT id FROM genres WHERE is_user_created=0)`);
    await this.db.execute(`UPDATE menu_items SET genre_id_2=NULL WHERE genre_id_2 NOT IN (SELECT id FROM genres WHERE is_user_created=0)`);
    await this.db.execute(`DELETE FROM genres WHERE is_user_created=1`);
  }
}

// ─── Browser IndexedDB モック ────────────────────────────────────────────────
class IndexedDbService implements IDbService {
  async init() {
    if (!(await get<MenuItem[]>('menu_items'))) await set('menu_items', []);
    if (!(await get<Genre[]>('genres')))       await set('genres', []);
  }

  private async getItems() { return (await get<MenuItem[]>('menu_items')) ?? []; }
  private async getGenres(){ return (await get<Genre[]>('genres'))        ?? []; }

  async getAllMenuItems()  { return this.getItems(); }
  async getAllGenres()     { return this.getGenres(); }

  async replaceOfficialMenus(dtos: MenuItemDto[], genreMap: Map<string, number>) {
    const existing = await this.getItems();
    const userItems = existing.filter(i => i.isUserAdded);
    const newItems: MenuItem[] = dtos.map(dto => ({
      id:          dto.id,
      name:        dto.name,
      name_en:     dto.name_en,
      name_zh:     dto.name_zh,
      price:       dto.price_with_tax,
      genreId:     genreMap.get(dto.genre) ?? 0,
      calorie:     dto.calorie,
      salt:        dto.salt,
      icon:        dto.icon ?? '',
      isAlcohol:   dto.is_alcohol,
      isUserAdded: false,
      sortKana:    dto.name,
      note:        '',
    }));
    await set('menu_items', [...userItems, ...newItems]);
  }

  async addUserItem(item: Omit<MenuItem, 'id'>, customId?: number): Promise<number> {
    const items = await this.getItems();
    let newId: number;
    if (customId !== undefined) {
      newId = customId;
    } else {
      const minId = items.filter(i => i.isUserAdded).reduce((m, i) => Math.min(m, i.id), 0);
      newId = Math.min(minId, 0) - 1;
    }
    await set('menu_items', [...items, { ...item, id: newId, isUserAdded: true }]);
    return newId;
  }

  async updateUserItem(item: MenuItem) {
    const items = await this.getItems();
    await set('menu_items', items.map(i => i.id === item.id ? item : i));
  }

  async updateItemGenres(id: number, genreId: number | null, genreId2: number | null) {
    const items = await this.getItems();
    await set('menu_items', items.map(i =>
      i.id === id ? { ...i, genreId: genreId ?? 0, genreId2: genreId2 ?? undefined } : i
    ));
  }

  async deleteUserItem(id: number) {
    const items = await this.getItems();
    await set('menu_items', items.filter(i => i.id !== id));
  }

  async addGenre(name: string, colorHex = '#1B8B3B', isUserCreated = false): Promise<number> {
    const genres = await this.getGenres();
    if (genres.find(g => g.name === name)) return -1;
    const newId = genres.reduce((m, g) => Math.max(m, g.id), 0) + 1;
    await set('genres', [...genres, { id: newId, name, isUserCreated, colorHex }]);
    return newId;
  }

  async deleteGenre(id: number) {
    const genres = await this.getGenres();
    const items  = await this.getItems();
    await set('genres', genres.filter(g => g.id !== id));
    await set('menu_items', items.map(i => ({
      ...i,
      genreId:  i.genreId  === id ? 0         : i.genreId,
      genreId2: i.genreId2 === id ? undefined  : i.genreId2,
    })));
  }

  async resetUserData(): Promise<void> {
    const genres = await this.getGenres();
    const items  = await this.getItems();
    const officialGenreIds = new Set(genres.filter(g => !g.isUserCreated).map(g => g.id));
    await set('genres', genres.filter(g => !g.isUserCreated));
    await set('menu_items', items
      .filter(i => !i.isUserAdded)
      .map(i => ({
        ...i,
        genreId:  officialGenreIds.has(i.genreId)  ? i.genreId  : 0,
        genreId2: i.genreId2 !== undefined && officialGenreIds.has(i.genreId2) ? i.genreId2 : undefined,
      }))
    );
  }
}

// ─── ヘルパー ────────────────────────────────────────────────────────────────
function rowToMenuItem(row: any): MenuItem {
  return {
    id:          row.id,
    name:        row.name,
    name_en:     row.name_en  || undefined,
    name_zh:     row.name_zh  || undefined,
    price:       row.price,
    genreId:     row.genre_id   ?? 0,
    genreId2:    row.genre_id_2 ?? undefined,
    calorie:     row.calorie  ?? undefined,
    salt:        row.salt     ?? undefined,
    icon:        row.icon     ?? '',
    isAlcohol:   row.is_alcohol === 1,
    isUserAdded: row.is_user_added === 1,
    sortKana:    row.sort_kana ?? '',
    note:        row.note     ?? '',
  };
}

function rowToGenre(row: any): Genre {
  return {
    id:            row.id,
    name:          row.name,
    isUserCreated: row.is_user_created === 1,
    colorHex:      row.color_hex ?? '#1B8B3B',
  };
}

// ─── シングルトン export ─────────────────────────────────────────────────────
export const dbService: IDbService = Capacitor.isNativePlatform()
  ? new SQLiteDbService()
  : new IndexedDbService();
