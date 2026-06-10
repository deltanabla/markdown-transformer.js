/**
 * @license MIT
 *
 * @fileoverview 日本語組版処理の要件に基づき、HTML文書を文字列に変換するクラス。
 */

import {HtmlTransformer} from '../html-transformer.js';
import {LineHeadIndenter} from './line-head-indenter.js';
import {LineSpacer} from './line-spacer.js';
import {BracketEncloser} from './bracket-encloser.js';

export class Transformer extends HtmlTransformer {
  /** 段落の内容をフォーマットします。 */
  formatParagraph(content) {
    return this.applyLineSpaces(
      !(
        this.currentBlockElement?.previousElementSibling
        instanceof HTMLParagraphElement
      ) ? 1 : 0,
      this.indenter.indent(1, super.formatParagraph(content)).trimEnd(),
      !(
        this.currentBlockElement?.nextElementSibling
        instanceof HTMLParagraphElement
      ) ? 1 : 0,
    );
  }

  /** 見出しの内容をフォーマットします。 */
  formatHeading(content) {
    const formatted = super.formatHeading(content);
    const level = this.resolveHeadingLevel(this.currentBlockElement) ?? 1;
    if (level <= 3) {
      return this.applyLineSpaces(
        3,
        this.indenter.indent(2 * level, formatted).trimEnd(),
        3,
      );
    }

    const previousLevel = this
      .resolveHeadingLevel(this.currentBlockElement?.previousElementSibling);
    const nextLevel =
      this.resolveHeadingLevel(this.currentBlockElement?.nextElementSibling);
    return this.applyLineSpaces(
      (previousLevel ?? 7) < level ? 0 : 3,
      this.indenter.indent(2 * (level - (3 - 1)), formatted).trimEnd(),
      (nextLevel ?? 0) > level ? 0 : 3,
    );
  }

  /** 区切り線をフォーマットします。 */
  formatThematicBreak(content) {
    return this.applyLineSpaces(
      2,
      '',
      0,
    );
  }

  /** 改行をフォーマットします。 */
  formatLinebreak(content) {
    return this.applyLineSpaces(
      0,
      '',
      0,
    );
  }

  /** リンクをフォーマットします。 */
  formatLink(content) {
    return this.applyReferenceBrackets(
      super.formatLink(content),
      this.currentInlineNode instanceof HTMLAnchorElement
        ? this.currentInlineNode.getAttribute('href') : null,
    );
  }

  /** 画像をフォーマットします。 */
  formatImage(content) {
    return this.applyReferenceBrackets(
      super.formatImage(content),
      this.currentInlineNode instanceof HTMLImageElement
        ? this.currentInlineNode.getAttribute('src') : null,
    );
  }

  /** 強調の内容をフォーマットします。 */
  formatEmphasis(content) {
    return this.applyBrackets(
      '「',
      '『',
      super.formatEmphasis(content),
      '』',
      '」',
    );
  }

  /** 強い強調の内容をフォーマットします。 */
  formatStrong(content) {
    return this.applyBrackets(
      '【',
      '〖',
      super.formatStrong(content),
      '〗',
      '】',
    );
  }

  /** インライン・コードをフォーマットします。 */
  formatCodeSpan(content) {
    return this.applyBrackets(
      '［',
      '〔',
      super.formatStrong(content),
      '〕',
      '］',
    );
  }

  /** その他のインライン要素の内容をフォーマットします。 */
  formatHtmlInline(content) {
    const formatted = super.formatHtmlInline(content);
    if (!(this.currentInlineNode instanceof HTMLElement)) {
      return formatted;
    }
    switch (this.currentInlineNode.localName) {
      case 'rt':
        return this.applyBrackets(
          '（',
          '〔',
          formatted,
          '〕',
          '）',
        );
    }
    return formatted;
  }

  #indenter;
  get indenter() {
    return this.#indenter;
  }

  #lineSpacer;
  get lineSpacer() {
    return this.#lineSpacer;
  }

  #bracketEncloser;
  get bracketEncloser() {
    return this.#bracketEncloser;
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
    super();
    this.#indenter = options.indenter ?? new LineHeadIndenter();
    this.#lineSpacer = options.lineSpacer ?? new LineSpacer();
    this.#bracketEncloser = options.bracketEncloser ?? new BracketEncloser();
  }

  /**
   * ブロック要素の前後に必要なアキ（改行）を挿入します。
   * @param {number} precedingSpaces 前方に必要なアキ。
   * @param {string} content 要素の内容。
   * @param {number} followingSpaces 後方に必要なアキ。
   */
  applyLineSpaces(precedingSpaces, content, followingSpaces) {
    const contentAfterSpaces = (this.accumulatedBlocks ?? '') === '' ? content
      : this.lineSpacer.space(
        this.accumulatedBlocks,
        precedingSpaces,
        content,
      ) + content;
    return contentAfterSpaces + this.lineSpacer.space(
      contentAfterSpaces,
      !this.currentBlockElement?.nextElementSibling ? 0 : followingSpaces,
    );
  }

  /**
   * 要素の見出しレベルを解決します。
   * `h1`から`h6`までの要素でない場合、前後の要素からレベルを推測します。
   *
   * @param {?HTMLElement} element 対象の要素。
   */
  resolveHeadingLevel(element) {
    if (!(element instanceof HTMLHeadingElement)) {
      return null;
    }

    const level = this.#parseHeadingLevel(element);
    if (level) {
      return level;
    }

    let previousElement = element;
    let previousLevel = null;
    while (previousElement.previousElementSibling && !previousLevel) {
      previousElement = previousElement.previousElementSibling;
      previousLevel = this.#parseHeadingLevel(previousElement);
    }

    let nextElement = element;
    let nextLevel = null;
    while (nextElement.nextElementSibling && !nextLevel) {
      nextElement = nextElement.nextElementSibling;
      nextLevel = this.#parseHeadingLevel(nextElement);
    }

    if (!previousLevel) {
      return nextLevel ?? 1;
    }
    if (!nextLevel) {
      return previousLevel;
    }
    return Math.min(
      Math.max(
        1,
        Math.round((previousLevel + nextLevel) / 2),
      ),
      6,
    );
  }

  /**
   * 参照情報を伴う内容に、括弧類を配置します。
   * @param {string} content 括弧を配置する対象の内容。
   * @param {?string} reference 参照情報。
   */
  applyReferenceBrackets(content, reference) {
    const enclosedContent = this.applyBrackets(
      '〈',
      '《',
      content,
      '》',
      '〉',
    );
    if ((reference ?? '') === '') {
      return enclosedContent;
    }

    return enclosedContent + this.bracketEncloser.enclose(
      enclosedContent,
      '（',
      '〔',
      reference,
      '〕',
      '）',
    );
  }

  /**
   * 括弧類を配置します。
   * 同一要素の入れ子に応じて括弧類を選択します。
   *
   * @param {string} primaryOpen 優先的に使用する始め括弧類。
   * @param {string} secondaryOpen 代替として使用する始め括弧類。
   * @param {string} content 括弧を配置する対象の内容。
   * @param {string} secondaryClose 代替として使用する終わり括弧類。
   * @param {string} primaryClose 優先的に使用する終わり括弧類。
   */
  applyBrackets(
    primaryOpen,
    secondaryOpen,
    content,
    secondaryClose,
    primaryClose,
  ) {
    let currentNode = this.currentInlineNode;
    let precedingText = '';
    let nestingDepth = 0;
    while (currentNode && currentNode !== this.currentBlockElement) {
      let siblingNode = currentNode;
      let siblingText = '';
      while (siblingNode.previousSibling) {
        siblingNode = siblingNode.previousSibling;
        siblingText = siblingNode.textContent + siblingText;
      }
      precedingText += siblingText;

      if (currentNode.nodeName === this.currentInlineNode?.nodeName) {
        nestingDepth++;
      }

      currentNode = currentNode.parentElement;
    }

    if (nestingDepth % 2) {
      return this.bracketEncloser.enclose(
        precedingText + this.accumulatedInlines,
        primaryOpen,
        secondaryOpen,
        content,
        secondaryClose,
        primaryClose,
      );
    }

    return this.bracketEncloser.enclose(
      precedingText + this.accumulatedInlines,
      secondaryOpen,
      primaryOpen,
      content,
      primaryClose,
      secondaryClose,
    );
  }

  /**
   * 要素の名前から見出しレベルを数値として抽出します。
   * @param {!HTMLElement} element 対象の見出し要素。
   */
  #parseHeadingLevel(element) {
    const match = element.localName.match(/^h([1-6])$/i);
    return !match ? null : parseInt(match[1], 10);
  }
}
