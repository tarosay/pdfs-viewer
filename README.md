# PDF Viewer

This is a web-based PDF viewer. It provides a simple landing page that loads a sample PDF and lets you upload your own files directly from the browser.

**New Feature:** Even when the PDF is displayed in full-screen mode, you can still click on embedded links and open their linked destinations. This ensures smooth navigation and interaction with linked content directly inside the viewer.

## Usage

1. Access the root URL: [https://tarosay.github.io/pdfs-viewer/](https://tarosay.github.io/pdfs-viewer/).
2. A sample PDF is displayed automatically.
3. To view your own file, use the **Upload and display a PDF file** control at the top of the screen to choose a PDF from your device.

## Query Parameters

You can customize the viewer behavior using URL query parameters. This is useful for setting up presentations.

| Parameter | Value | Description |
| :--- | :--- | :--- |
| **`slide`** | `on` / `off` | **Slide Mode.** <br>`on`: Enables page-fit view, hides standard UI/toolbars, and shows a "Fullscreen" button (the button hides automatically while in fullscreen). <br>`off`: Standard scrolling mode. |
| **`guide`** | `on` / `off` | **Mascot Visibility.** <br>Controls whether to show the "Mikankame" progress character. When shown, the character stays still at its starting position until you press the **Start** button (see below). |
| **`time`** | `number` | **Duration (minutes).** <br>Sets the time it takes for the character to cross the screen. (Default: 5) |

## On-Screen Controls

While viewing a PDF, a small button group is always available in the bottom-right corner, regardless of fullscreen state or whether the header is hidden:

| Button | Description |
| :--- | :--- |
| **Slide Mode** | Toggles Slide Mode on/off, equivalent to the `slide` parameter. |
| **Fullscreen** | Enters/exits fullscreen (hidden automatically while in fullscreen). |
| **Start** | Moves the "Mikankame" character back to its starting position and starts (or restarts) its crossing animation. Use this to kick off the mascot exactly when your presentation begins, rather than the moment the PDF loads. |

### Examples

* **Presentation Mode (10 min):**
  [https://tarosay.github.io/pdfs-viewer/?slide=on&guide=on&time=10](https://tarosay.github.io/pdfs-viewer/?slide=on&guide=on&time=10)

* **Simple Slide Mode (No mascot):**
  [https://tarosay.github.io/pdfs-viewer/?slide=on](https://tarosay.github.io/pdfs-viewer/?slide=on)

---

# PDFビューア

これはウェブベースのPDFビューアです。トップページでサンプルPDFを読み込み、ブラウザから直接ファイルをアップロードして表示できます。

**新機能:** PDFを全画面表示にしても、埋め込まれたリンクをクリックしてリンク先を開くことができます。これにより、PDF内のリンクコンテンツにスムーズにアクセスできます。

## 使い方

1. ルートURL（[https://tarosay.github.io/pdfs-viewer/](https://tarosay.github.io/pdfs-viewer/)）にアクセスします。
2. サンプルPDFが自動的に表示されます。
3. 自分のPDFを閲覧したい場合は、画面上部の **PDFファイルをアップロードして表示** コントロールからファイルを選択してください。アップロードすると直ちにそのファイルが表示されます。

## URLパラメータによる設定（カスタマイズ）

URLの末尾に以下のパラメータを付けることで、表示モードや機能を設定できます。プレゼンテーションを行う際に便利です。

| パラメータ名 | 設定値 | 説明 |
| :--- | :--- | :--- |
| **`slide`** | `on` / `off` | **スライド機能（プレゼンモード）**<br>`on`: ページ単位の表示になり、ツールバー等のUIが隠れます。「全画面」ボタンが表示されます（全画面表示中はボタンは自動的に隠れます）。<br>`off`: 通常の縦スクロール表示になります。 |
| **`guide`** | `on` / `off` | **ガイドキャラクター表示**<br>進行状況を示すキャラクター（ミカンカメ）を表示するかどうか設定します。表示時はスタート位置で静止しており、下記の**スタート**ボタンを押すまでは動き出しません。 |
| **`time`** | 数値 | **所要時間（分）**<br>キャラクターが画面を横断しきるまでの時間を「分」で指定します。（指定なしのデフォルトは5分） |

## 画面上のコントロール

PDF表示中は、フルスクリーンの状態やヘッダーの表示・非表示に関わらず、画面右下に常時ボタン群が表示されます。

| ボタン | 説明 |
| :--- | :--- |
| **スライド機能** | `slide`パラメータと同様に、スライド機能のON/OFFを切り替えます。 |
| **全画面** | 全画面表示のON/OFFを切り替えます（全画面中は自動的に隠れます）。 |
| **スタート** | 「ミカンカメ」をスタート位置に戻し、画面横断アニメーションを開始（またはやり直し）します。PDFの読み込み時ではなく、発表を開始するタイミングでこのボタンを押すことで、亀の動き出しを合わせることができます。 |

### URLの例

* **10分間のプレゼンテーション（フルセット）**
  [https://tarosay.github.io/pdfs-viewer/?slide=on&guide=on&time=10](https://tarosay.github.io/pdfs-viewer/?slide=on&guide=on&time=10)

* **キャラクターなし、スライド機能のみ**
  [https://tarosay.github.io/pdfs-viewer/?slide=on](https://tarosay.github.io/pdfs-viewer/?slide=on)

* **通常表示（設定のリセット）**
  [https://tarosay.github.io/pdfs-viewer/?slide=off](https://tarosay.github.io/pdfs-viewer/?slide=off)

---

### デモファイル

以下のリンクは従来の直接リンク形式ですが、上記のルートURLパラメータの使用を推奨します。

* **AIでテーマソング**
  [https://tarosay.github.io/pdfs-viewer/web/viewer.html?file=AIでテーマソング.pdf](https://tarosay.github.io/pdfs-viewer/web/viewer.html?file=AIでテーマソング.pdf)

* **ラズパイとiPhoneのhttps接続**
  [https://tarosay.github.io/pdfs-viewer/web/viewer.html?file=ラズパイとiPhoneのhttps接続.pdf](https://tarosay.github.io/pdfs-viewer/web/viewer.html?file=ラズパイとiPhoneのhttps接続.pdf)

---

## License

This project is licensed under the [**MIT License**](LICENSE).