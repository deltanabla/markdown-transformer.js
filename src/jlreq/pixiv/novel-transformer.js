/**
 * @license MIT
 *
 * @fileoverview pixiv小説記法への変換を行うクラス。
 */

import {Transformer as JlReqTransformer} from '../transformer.js';
import {LineHeadIndenter} from './line-head-indenter.js';
import {LineSpacer} from '../line-spacer.js';
import {BracketEncloser} from '../bracket-encloser.js';

export class NovelTransformer extends JlReqTransformer {
  formatHeading(content) {
    const level = this.resolveHeadingLevel(this.currentBlockElement);
    if (level > 0) {
      const formatted = super.formatHeading(content);
      return level > 1 ? formatted : this.applyNewPage(formatted);
    }
    return this.applyNewPage(`[chapter:${content}]`);
  }

  formatLink(content) {
    if (this.currentInlineNode instanceof HTMLAnchorElement) {
      return `[[jumpuri:${content} > ${this.currentInlineNode.href}]]`;
    }
    return super.formatLink(content);
  }

  formatHtmlInline(content) {
    if (!(this.currentInlineNode instanceof HTMLElement)) {
      return super.formatHtmlInline(content);
    }
    switch (this.currentInlineNode.localName) {
      case 'ruby':
        return `[[rb:${content}]]`;
      case 'rt':
        const rubyText = ` > ${content}`;
        let nextSibling = this.currentInlineNode;
        while (nextSibling.nextSibling) {
          nextSibling = nextSibling.nextSibling;
          if (
            nextSibling instanceof HTMLElement
            && nextSibling.localName === 'rt'
          ) {
            return rubyText + ']][[rb:';
          }
        }
        return rubyText;
    }
    return super.formatHtmlInline(content);
  }

  formatStrong(content) {
    return `[b:${content}]`;
  }

  formatEmphasis(content) {
    return `[[emphasismark:${content} > ﹅]]`;
  }

  resolveHeadingLevel(element) {
    const level = super.resolveHeadingLevel(element) ?? 1;
    return level - 1;
  }

  /**
   * インスタンスを初期化します。
   * @param {{
   *     indenter: ?LineHeadIndenter,
   *     lineSpacer: ?LineSpacer,
   *     bracketEncloser: ?BracketEncloser,
   * }} options オプション設定。
   */
  constructor(options = {}) {
    super({
      ...{indenter: new LineHeadIndenter()},
      ...options,
    });
  }

  /**
   * コンテンツに改ページ処理を適用します。
   * すでに改ページ位置である場合は、コンテンツをそのまま返します。
   *
   * @param {string} content 改ページを適用するコンテンツ。
   */
  applyNewPage(content) {
    if (
      /^\s*$|\[newpage\]\s*$|\[chapter:[^\]]*\]\s*$/
        .test(this.accumulatedBlocks ?? '')
    ) {
      return content;
    }

    return this.applyLineSpaces(
      0,
      '[newpage]\n'
      + content.replace(/^[\r\n]+/, ''),
      0,
    );
  }
}
