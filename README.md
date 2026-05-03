# サイゼリスト

非公式サイゼリヤメニュー管理アプリ  
Ionic 8 (React) + Capacitor 6 で構築

<img width="339" height="500" alt="Image" src="https://github.com/user-attachments/assets/6abd66f9-645b-40ee-85dd-07f3faefaa64" />

---

## 機能

- **メニュー一覧** — 番号・名前・価格・カロリー・塩分を表示（0 は非表示）
- **検索 / ソート** — メニュー名・番号で絞り込み、価格・かな順ソート対応
- **ジャンルフィルター** — 最大 2 つのジャンルをメニューに設定、タブで絞り込み
- **ジャンル管理** — ユーザーがジャンルを自由に作成・削除（カラー設定あり）。件数右のゴミ箱ボタンから削除可能
- **番号コピー** — タップで注文番号をクリップボードにコピー（ネイティブは触覚フィードバック付き）
- **ユーザーメニュー追加・編集・削除** — 任意のメニューを追加可能。一覧の赤いゴミ箱ボタンまたはロングプレスから削除
- **言語切替** — 日本語 / 英語 / 中国語表示に対応
- **リモート自動更新** — 起動時に 1 日 1 回 GitHub の最新データを確認、新バージョンがあれば自動取得
- **手動更新** — 設定画面からいつでも最新データを確認・取得可能
- **カスタムデータリセット** — 設定画面から追加したジャンル・メニューを一括削除可能
- **スプラッシュ画面** — 初回データ取得・更新中はプログレスバー付き画面を表示

---

## セットアップ

```bash
npm install
ionic serve          # ブラウザで開発開始 → http://localhost:8100
```

---

## Android ビルド

```bash
ionic build
npx cap sync android
# Android Studio で開いてビルド・実行
npx cap open android
```

---

## アプリの動作フロー

```
起動
  ├── DB 初期化
  ├── seedIfNeeded()
  │     ├── MENU_VERSION と DB の seeded_version を比較
  │     └── 古い / 未シード → バンドル済みデータ (public/data/saizeriya.json) で DB を構築
  │
  ├── shouldCheckToday() → 本日未チェックの場合のみ:
  │     ├── GitHub から最新 JSON をフェッチ・バリデーション
  │     ├── last_updated が現在 DB より新しければ DB を更新
  │     └── チェック日時を Preferences に保存（以降の起動ではスキップ）
  │
  └── DB からアイテム・ジャンルをロードして表示
```

---

## メニューデータの手動更新手順

[ryohidaka/saizeriya-menus](https://github.com/ryohidaka/saizeriya-menus) でメニュー改定があった場合、バンドルデータを更新してアプリをビルドし直す手順:

```bash
# 1. 最新データをダウンロード (スキーマチェック付き)
npm run update-menu

# 2. ビルド & Android 同期
ionic build && npx cap sync android

# ※ まとめて実行:
npm run release
```

### 更新されるファイル

| ファイル | 内容 |
|----------|------|
| `public/data/saizeriya.json` | メニューデータ本体 |
| `src/config/menuVersion.ts` | バージョン定数（コンパイル時埋め込み） |

### スキーマ変更があった場合

`npm run update-menu` がエラーを出力します:

```
❌ スキーマ変更を検出: 以下のフィールドが見つかりません: xxx
   src/models/types.ts の MenuItemDto を確認してください。
```

`src/models/types.ts` と `src/services/db.service.ts` の対応フィールドを修正してから再実行してください。

---

## アイコン生成

```bash
npx @capacitor/assets generate --config capacitor.assets.config.ts
```

---

## データソース

[ryohidaka/saizeriya-menus](https://github.com/ryohidaka/saizeriya-menus) (MIT License)  
メニュー情報の著作権はサイゼリヤ株式会社に帰属します。

本アプリは**非公式**です。最新情報は[公式サイト](https://www.saizeriya.co.jp/)をご確認ください。
