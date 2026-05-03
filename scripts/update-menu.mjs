#!/usr/bin/env node
/**
 * npm run update-menu
 *
 * ryohidaka/saizeriya-menus の最新データをダウンロードして
 *   public/data/saizeriya.json   ← バンドルされる実データ
 *   src/config/menuVersion.ts    ← バージョン定数 (コンパイル時に埋め込み)
 * の 2 ファイルを更新します。
 *
 * スキーマが変わっていなければ追加作業は不要です。
 * 更新後は通常通りビルド → APK 配布してください。
 *
 *   npm run update-menu
 *   ionic build && npx cap sync android
 */

import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname }         from 'path';
import { fileURLToPath }            from 'url';

const __dir  = dirname(fileURLToPath(import.meta.url));
const root   = resolve(__dir, '..');

const JSON_URL = 'https://raw.githubusercontent.com/ryohidaka/saizeriya-menus/main/saizeriya.json';
const JSON_OUT = resolve(root, 'public/data/saizeriya.json');
const VER_OUT  = resolve(root, 'src/config/menuVersion.ts');

// ─── ダウンロード ─────────────────────────────────────────────────────────────
console.log('⬇️  Downloading saizeriya.json...');
const res = await fetch(JSON_URL);
if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON_URL}`);
const data = await res.json();

// ─── スキーマ簡易チェック ──────────────────────────────────────────────────────
const sample = data.menus?.[0];
const REQUIRED = ['id','name','price_with_tax','genre','calorie','salt','icon','is_alcohol'];
const missing  = REQUIRED.filter(k => !(k in sample));
if (missing.length > 0) {
  console.error(`❌ スキーマ変更を検出: 以下のフィールドが見つかりません: ${missing.join(', ')}`);
  console.error('   src/models/types.ts の MenuItemDto を確認してください。');
  process.exit(1);
}

// ─── ファイル書き出し ─────────────────────────────────────────────────────────
mkdirSync(resolve(root, 'public/data'), { recursive: true });
mkdirSync(resolve(root, 'src/config'),  { recursive: true });

writeFileSync(JSON_OUT, JSON.stringify(data, null, 2), 'utf-8');

writeFileSync(VER_OUT,
`// ⚠️ このファイルは npm run update-menu で自動生成されます。直接編集しないでください。
// Generated: ${new Date().toISOString()}
export const MENU_VERSION = '${data.last_updated}';
`, 'utf-8');

// ─── 結果サマリー ─────────────────────────────────────────────────────────────
const genres = [...new Set(data.menus.map(m => m.genre))].sort();
console.log(`✓ ${data.menus.length} 件のメニューを取得`);
console.log(`✓ バージョン: ${data.last_updated}`);
console.log(`✓ ジャンル (${genres.length}種): ${genres.join(' / ')}`);
console.log('');
console.log('更新ファイル:');
console.log('  public/data/saizeriya.json');
console.log('  src/config/menuVersion.ts');
console.log('');
console.log('次のステップ:');
console.log('  ionic build && npx cap sync android');
console.log('  → APK をビルドして再配布してください');
