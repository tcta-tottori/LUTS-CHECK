# LUTS-CHECK — ZR ルック比較（PWA）

Nikon ZR の LUT と、Imaging Cloud に登録したピクチャーコントロールを、撮影現場でスマホから見比べるためのアプリ。
GitHub Pages に置くだけで動く（ビルド不要の静的サイト）。ホーム画面に追加するとアプリとして起動し、画像を保存すれば電波が無くても使える。

## できること

- **LUT 45 本の比較**：ワイプ／並べる／押して切替。比較の基準は「LUT なし（N-Log）」と「ZR 内蔵 REC.709」から選べる
- **右から開く LUT 一覧**：画面右端の「LUT 一覧」タブでドロワーを開くと、小さなサムネイル付きの一覧が出る。スマホでは比較画面が上に残ったまま一覧をスクロールでき、押した LUT がその場で反映される
- **場面は 4 つ**：おもちゃ展示・室内の肌色・明るいホール・屋外の緑と空（Nikon ZR N-Log 4K 59.94p から書き出し）
- **絞り込み**：★本体登録おすすめ 10 本 / IPP2 テクニカル 16 / RED クリエイティブ 24 / Nikon N-Log 5
- **カラー一覧**：下のギャラリーはスマホで 1 行 2 コマ。名前は短縮表示（デスクトップはファイル名のまま）
- **ピクチャーコントロール**：C-1 の CineBias_RED と、クラウド登録の 9 種（特徴・向いている場面・公式レシピページへのリンク）に、効果のかかり具合を見る見本付き
- **オフライン**：Service Worker が画像をキャッシュ。「画像をすべて保存」で 184 枚（約 11MB）をまとめて保存
- **画面**：DaVinci Resolve に寄せた黒基調のダーク UI（画の周りを無彩色にして色味を見やすくする）

## ピクチャーコントロールの見本について

ピクチャーコントロールは撮影時に色が焼き込まれるため、LUT のような比較画像を後から作れない。
そこで各ルックの傾向（色の寄り・コントラスト・彩度）を、ZR 内蔵 REC.709 の画に CSS で重ねた**近似表示**を見本にしている。

- 影の色は screen 合成、ハイライトの色は multiply 合成で重ねる（乗算 → スクリーンの順に重ね、ハイライトの色が影のリフトで打ち消されないようにする）
- 「効果の強さ」スライダーは重ねる層の不透明度。0% で ZR 内蔵 REC.709 そのもの、100% で傾向を最も強く出した状態
- 見本を押している間は効果なしの画に戻るので、かかり具合を見比べられる
- 傾向の定義は `index.html` の `GRADES`。実機の色そのものではないので、正確な色は各カードの公式レシピページで確認する

## 画像の作り方

`render.py`（このリポジトリには含めない場合は `AI Movie/work/lutlab/render.py`）が、N-Log の 16bit フレームから各 LUT 適用画像を書き出す。

- RED の LUT は RWG/Log3G10 入力なので、N-Log → 線形 → RWG → Log3G10 に変換してから 33 点 LUT を三線形補間で適用
- 検算：IPP2 標準 LUT の結果と Nikon 公式 N-Log→Rec.709 LUT の結果は、4 場面とも平均輝度の差 0.001 以内
- 出力は 960×540 の JPEG（quality 82）

## 公開手順（GitHub Pages）

```bash
cd ~/Desktop/LUTS-CHECK
git init
git add -A
git commit -m "ZR ルック比較 PWA"
git branch -M main
git remote add origin https://github.com/tcta-tottori/LUTS-CHECK.git
git push -u origin main
```

そのあと GitHub の **Settings > Pages** で Source を `Deploy from a branch` → `main` / `/ (root)` にする。
数十秒後に `https://tcta-tottori.github.io/LUTS-CHECK/` で公開される（PWA は HTTPS が必須。GitHub Pages は HTTPS）。

スマホでの追加方法：

- iPhone（Safari）：共有ボタン →「ホーム画面に追加」
- Android（Chrome）：メニュー →「アプリをインストール」、またはアプリ内の「ホーム画面に追加」ボタン

## 中身

```
index.html                アプリ本体（1 ファイル。外部 CDN は Google Fonts のみ）
manifest.webmanifest      PWA の設定
sw.js                     Service Worker（アプリ本体と画像のキャッシュ）
icons/                    アイコン（192 / 512 / maskable / apple-touch）
img/<場面>/<LUT名>.jpg     比較画像 184 枚
.nojekyll                 GitHub Pages の Jekyll 処理を止める
```

## 更新するとき

1. 画像を作り直す or 追加する
2. `sw.js` の `VERSION` を上げる（`v1` → `v2`）。古いキャッシュが破棄され、端末に新しい画像が届く
3. commit して push

## 注意

- 画像は個人の撮影素材。**公開リポジトリに置くと誰でも見られる**ので、公開範囲は用途に合わせて選ぶ
- LUT ファイル自体（RED / Nikon / DJI 配布物）はこのリポジトリに含めない。再配布の条件が配布元ごとに異なるため
