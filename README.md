# Markdown Transformer

Markdownを解析し、特定の要件に基づいたテキスト構造へ変換します。

## 開始

ブラウザーですぐに試せます。

1.  [ライブ・デモ](https://deltanabla.github.io/markdown-transformer.js/)を開きます。
1.  Markdownを入力し、**変換**ボタンを押して、結果を**コピー**してください。

## 機能

```js
import {MarkdownTransformer, JlReqTransformer} from './index.js';

const markdown = 'Hello *world*';
const transformer = new MarkdownTransformer(markdown);

const result = transformer.transform(new JlReqTransformer());
console.log(result);
```

[`HtmlTransformer`クラス]を継承することで、独自の変換器を容易に作成できます。

[`HtmlTransformer`クラス]: ./src/html-transformer.js

### [`MarkdownTransformer`クラス](./src/markdown-transformer.js)

[commonmark.js](https://github.com/commonmark/commonmark.js)を使用し、DOMとして解析します。

### [`HtmlTransformer`クラス]

HTML要素を再帰的に走査するための抽象クラスです。

#### [`JlReqTransformer`クラス](./src/jlreq/transformer.js)

日本語に特化した具象クラスです。

現在は一部のブロック要素に対応しています。

-   `h1`から`h6`まで
-   `hr`
-   `p`
