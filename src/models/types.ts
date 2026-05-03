// ────────────────────────────────────────────────────────────────────────────
// アプリ内モデル
// ────────────────────────────────────────────────────────────────────────────

export type Language = 'ja' | 'en' | 'zh';

export interface MenuItem {
  /** 正値: OSS由来 (モバイルオーダー番号), 負値: ユーザー追加 */
  id: number;
  name: string;
  name_en?: string;
  name_zh?: string;
  /** 税込価格 (price_with_tax) */
  price: number;
  genreId: number;        // タグ(ジャンル)ID (1つ目)
  genreId2?: number;      // タグ(ジャンル)ID (2つ目、省略可)
  calorie?: number;
  salt?: number;
  icon: string;           // 絵文字 e.g. "🥗"
  isAlcohol: boolean;
  isUserAdded: boolean;
  sortKana: string;       // 五十音ソート用読み仮名
  note: string;
}

export function getDisplayName(item: MenuItem, lang: Language): string {
  if (lang === 'en' && item.name_en) return item.name_en;
  if (lang === 'zh' && item.name_zh) return item.name_zh;
  return item.name;
}

export interface Genre {
  id: number;
  name: string;           // "サラダ" "ピザ" "パスタ" etc.
  isUserCreated: boolean;
  colorHex: string;
}

export type SortOrder =
  | 'id_asc'
  | 'price_asc'
  | 'price_desc'
  | 'kana_asc'
  | 'kana_desc';

export const SORT_LABELS: Record<SortOrder, string> = {
  id_asc:    '番号順',
  price_asc: '価格 安い順',
  price_desc:'価格 高い順',
  kana_asc:  'あ → ん',
  kana_desc: 'ん → あ',
};

export interface UpdateCheckResult {
  type: 'up_to_date' | 'already_checked' | 'update_available' | 'error';
  version?: string;
  releaseNote?: string;
  message?: string;
}

export interface GitHubRelease {
  tag_name: string;
  published_at: string;
  body: string;
}

// ────────────────────────────────────────────────────────────────────────────
// OSSデータ DTO (ryohidaka/saizeriya-menus saizeriya.json の実際の構造)
// ────────────────────────────────────────────────────────────────────────────

/** saizeriya.json のトップレベル構造 */
export interface SaizeriyaJsonRoot {
  menus: MenuItemDto[];
  last_updated: string;   // ISO8601 e.g. "2026-03-05T09:43:49Z"
}

/** menus 配列の各要素 */
export interface MenuItemDto {
  id: number;
  name: string;
  name_en: string;
  name_zh: string;
  price: number;           // 税抜価格
  price_with_tax: number;  // 税込価格 ← 表示にはこちらを使用
  calorie: number;         // kcal (※ calories ではなく calorie)
  salt: number;            // 食塩相当量 (g)
  category: string;        // "グランド" | "キッズ" ← メニュー区分 (2種類のみ)
  category_en: string;
  category_zh: string;
  genre: string;           // "サラダ" | "ピザ" | "パスタ" etc. ← タグフィルターに使用
  is_alcohol: boolean;
  icon: string;            // 絵文字 e.g. "🥗"
  pre_id: string;          // 旧メニューID e.g. "SA02"
}
