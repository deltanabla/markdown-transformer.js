/**
 * @license MIT
 *
 * @fileoverview Markdown文書の構造変換を管理するクラス。
 */

import {HtmlTransformer} from './html-transformer.js';
import 'https://unpkg.com/commonmark@latest/dist/commonmark.min.js';

export class MarkdownTransformer {
  #document;

  /**
   * MarkdownをHTML文書として解析します。
   * @param {string} markdown 変換対象のMarkdown文字列。
   */
  constructor(markdown) {
    this.#document = new DOMParser().parseFromString(
      new commonmark.HtmlRenderer()
        .render(new commonmark.Parser().parse(markdown)),
      'text/html',
    );
  }

  /**
   * 指定した変換器を用いて、文書の複製に対して変換処理を適用します。
   * @param {!HtmlTransformer} transformer 変換ロジックを保持するインスタンス。
   */
  transform(transformer) {
    return transformer.transform(this.#document.body.cloneNode(true));
  }
}
