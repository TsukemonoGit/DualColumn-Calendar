# DualColumn-Calendar

日本の祝日に対応したA4横向き・2ヶ月分割カレンダー生成ツール。印刷後に中央で裁断してA5縦サイズとして使用する設計です。

### プレビュー
![カレンダーのサンプル画像](https://share.yabu.me/84b0c46ab699ac35eb2ca286470b85e081db2087cdef63932236c397417782f5/50c216e76bc6fd208c68c9044e8138f0baabbcd60db11538084035911b9c5dc6.webp)
A4横で印刷して、中央の点線で切るとA5サイズになります。

---

## 特徴

* **A4横 1枚に2ヶ月分**: 左右に1ヶ月ずつ配置。中央のガイド線でカットすることでA5リフィルとして機能します。
* **祝日自動反映**: 任意の年を入力すると、その年の日本の祝日データ（振替休日・国民の休日含む）を自動取得し、赤色背景と祝日名を表示します。
* **記入スペース最大化**: 余白を極限まで削り、日々の予定を書き込みやすいレイアウトに最適化しています。

## 祝日データについて

内閣府が公開している[国民の祝日CSV](https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv)を使用しています。

* **公式データ使用**: 振替休日・国民の休日も含めた正確な祝日情報を取得
* **サーバーサイド処理**: Vercel Serverless Functionsを経由して取得することでCORS制限を回避
* **キャッシュ対応**: 一度取得したデータはキャッシュされ、年の切り替え時も高速表示

## 技術構成

```
├── api/
│   └── holidays.js        # Serverless Function（内閣府CSVを取得）
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
└── vercel.json
```

* **フロントエンド**: バニラJavaScript（フレームワーク不使用）
* **バックエンド**: Vercel Serverless Functions
* **デプロイ**: Vercel（GitHub連携による自動デプロイ）

## 使い方

1. 生成したい **「年」** を入力し、 **「生成・更新」** ボタンを押します。
2. 画面上にカレンダーが表示されたら **「印刷する」** をクリックします。
3. 印刷設定で **「レイアウト：横向き」** に設定し、カラーで出力してください。

## ローカル開発

```bash
# リポジトリをクローン
git clone https://github.com/username/repo-name.git
cd repo-name

# Vercel CLIをインストール（初回のみ）
npm i -g vercel

# 開発サーバー起動
vercel dev
```

http://localhost:3000 でアクセス可能。

## デプロイ

GitHubにプッシュするだけで自動デプロイされます。

```bash
git add .
git commit -m "Update"
git push
```

## ライセンス

MIT
```