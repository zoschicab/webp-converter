# WebP Converter

フォルダ内のJPEG、PNGの画像を一括でWebPに変換

## 必要条件

Node.js 17.6.0

## 使い方

```bash
node webp-converter.js --input example
```

### コマンドオプション

```text
-i, --input <string>    ソースディレクトリ（必須）
-o, --out <string>      出力先ディレクトリ (default: ソースディレクトリ)
-q, --quality <number>  画質 (default: 75)
-r, --replace-suffix    拡張子をwebpに置き換える (default: false)
-h, --help              ヘルプを表示
```
