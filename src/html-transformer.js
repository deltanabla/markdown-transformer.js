/**
 * @license MIT
 *
 * @fileoverview HTML文書を文字列に変換するクラス。
 */

export class HtmlTransformer {
  /** @type {?HTMLElement} */
  #currentBlockElement = null;
  get currentBlockElement() {
    return this.#currentBlockElement;
  }

  /** @type {?string} */
  #accumulatedBlocks = null;
  get accumulatedBlocks() {
    return this.#accumulatedBlocks;
  }

  /** @type {?Node} */
  #currentInlineNode = null;
  get currentInlineNode() {
    return this.#currentInlineNode;
  }

  /** @type {?string} */
  #accumulatedInlines = null;
  get accumulatedInlines() {
    return this.#accumulatedInlines;
  }

  #VIRTUAL_BLOCK_TYPE = 'anonymous-block';

  /**
   * 指定したHTML要素を文字列に変換します。
   * @param {!HTMLElement} html 変換対象のHTML要素。
   */
  transform(html) {
    const serialized = this.#serializeBlocks(html);
    this.#currentBlockElement = null;
    this.#accumulatedBlocks = null;
    this.#currentInlineNode = null;
    this.#accumulatedInlines = null;
    return serialized;
  }

  /**
   * ブロック要素を再帰的に走査してシリアライズします。
   * @param {!HTMLElement} parentElement 走査対象の親要素。
   * @param {string} accumulatedBlocks 直前までの蓄積文字列。
   */
  #serializeBlocks(parentElement, accumulatedBlocks = '') {
    let serialized = '';
    for (const childElement of [...parentElement.children]) {
      this.#currentBlockElement = childElement;
      this.#accumulatedBlocks = serialized;
      this.#currentInlineNode = null;
      this.#accumulatedInlines = null;

      if (childElement instanceof HTMLParagraphElement) {
        serialized += this.finalizeLeafBlock(
          this.formatParagraph(this.#serializeInlines(childElement)),
        );
        continue;
      }

      if (
        (childElement instanceof HTMLQuoteElement)
        && childElement.localName === 'blockquote'
      ) {
        serialized += this.finalizeContainerBlock(
          this
            .formatBlockQuote(this.#serializeBlocks(childElement, serialized)),
        );
        continue;
      }

      if (childElement instanceof HTMLLIElement) {
        if (!childElement.querySelector(':scope > p')) {
          /** @type {?HTMLDivElement} */
          let virtualBlock = null;
          for (const grandchildNode of [...childElement.childNodes]) {
            if (
              grandchildNode instanceof HTMLParagraphElement
              || grandchildNode instanceof HTMLQuoteElement
              || grandchildNode instanceof HTMLLIElement
              || grandchildNode instanceof HTMLUListElement
              || grandchildNode instanceof HTMLOListElement
              || grandchildNode instanceof HTMLHeadingElement
              || grandchildNode instanceof HTMLPreElement
              || grandchildNode instanceof HTMLHRElement
            ) {
              virtualBlock = null;
              continue;
            }

            if (!virtualBlock) {
              virtualBlock =
                grandchildNode.ownerDocument?.createElement('div');
              if (!virtualBlock) {
                continue;
              }

              virtualBlock.dataset.dn12mtType = this.#VIRTUAL_BLOCK_TYPE;
              grandchildNode.before(virtualBlock);
            }
            virtualBlock.append(grandchildNode);
          }
        }
        serialized += this.finalizeContainerBlock(
          this.formatItem(this.#serializeBlocks(childElement, serialized)),
        );
        continue;
      }
      if ((childElement instanceof HTMLDivElement) && (
        (childElement.dataset.dn12mtType ?? null)
        === this.#VIRTUAL_BLOCK_TYPE
      )) {
        serialized +=
          this.finalizeLeafBlock(this.#serializeInlines(childElement));
        continue;
      }

      if (childElement instanceof HTMLUListElement) {
        serialized += this.finalizeContainerBlock(
          this.formatList(this.#serializeBlocks(childElement, serialized)),
        );
        continue;
      }

      if (childElement instanceof HTMLOListElement) {
        serialized += this.finalizeContainerBlock(
          this.formatList(this.#serializeBlocks(childElement, serialized)),
        );
        continue;
      }

      if (childElement instanceof HTMLHeadingElement) {
        serialized += this.finalizeLeafBlock(
          this.formatHeading(this.#serializeInlines(childElement)),
        );
        continue;
      }

      if (
        (childElement instanceof HTMLPreElement)
        && childElement.childNodes.length === 1
        && (childElement.childNodes[0] instanceof HTMLElement)
        && childElement.childNodes[0].localName === 'code'
      ) {
        serialized += this.finalizeLeafBlock(
          this.formatCodeBlock(childElement.textContent),
        );
        continue;
      }

      if (childElement instanceof HTMLHRElement) {
        serialized += this.finalizeLeafBlock(
          this.formatThematicBreak(childElement.textContent),
        );
        continue;
      }

      serialized += this.finalizeContainerBlock(
        this.formatHtmlBlock(this.#serializeBlocks(childElement, serialized)),
      );
    }

    this.#currentBlockElement = parentElement;
    this.#accumulatedBlocks = accumulatedBlocks;
    return serialized;
  }

  /**
   * インライン要素を再帰的に走査してシリアライズします。
   * @param {!HTMLElement} parentElement 走査対象の親要素。
   * @param {string} accumulatedInlines 直前までの蓄積文字列。
   */
  #serializeInlines(parentElement, accumulatedInlines = '') {
    let serialized = '';
    for (const childNode of [...parentElement.childNodes]) {
      this.#currentInlineNode = childNode;
      this.#accumulatedInlines = serialized;

      if (childNode instanceof Text) {
        serialized += this.finalizeInline(this.formatText(
          childNode.textContent
            .replace(/\r|\n/g, ''),
        ));
        continue;
      }
      if (childNode instanceof HTMLBRElement) {
        serialized += this
          .finalizeInline(this.formatLinebreak(childNode.textContent));
        continue;
      }
      if (childNode instanceof HTMLAnchorElement) {
        serialized += this.finalizeInline(
          this.formatLink(this.#serializeInlines(childNode, serialized)),
        );
        continue;
      }
      if (childNode instanceof HTMLImageElement) {
        serialized += this.finalizeInline(this.formatImage(childNode.alt));
        continue;
      }

      if (!(childNode instanceof HTMLElement)) {
        continue;
      }

      switch (childNode.localName) {
        case 'em':
          serialized += this.finalizeInline(
            this.formatEmphasis(this.#serializeInlines(childNode, serialized)),
          );
          break;
        case 'strong':
          serialized += this.finalizeInline(
            this.formatStrong(this.#serializeInlines(childNode, serialized)),
          );
          break;
        case 'code':
          serialized +=
            this.finalizeInline(this.formatCodeSpan(childNode.textContent));
          break;
        default:
          serialized += this.finalizeInline(
            this
              .formatHtmlInline(this.#serializeInlines(childNode, serialized)),
          );
      }
    }

    this.#currentInlineNode = parentElement;
    this.#accumulatedInlines = accumulatedInlines;
    return serialized;
  }

  /**
   * 段落の内容をフォーマットします。
   * 継承クラスでオーバーライドすることを想定しています。
   * @param {string} content 段落の内容。
   */
  formatParagraph(content) {
    return content;
  }

  /**
   * 見出しの内容をフォーマットします。
   * 継承クラスでオーバーライドすることを想定しています。
   * @param {string} content 見出しの内容。
   */
  formatHeading(content) {
    return content;
  }

  /**
   * コード・ブロックの内容をフォーマットします。
   * 継承クラスでオーバーライドすることを想定しています。
   * @param {string} content コード・ブロックの内容。
   */
  formatCodeBlock(content) {
    return content;
  }

  /**
   * 区切り線をフォーマットします。
   * 継承クラスでオーバーライドすることを想定しています。
   * @param {string} content 要素内のテキスト。通常は空です。
   */
  formatThematicBreak(content) {
    return content;
  }

  /**
   * 最小単位のブロックの最終調整を行います。
   * 継承クラスでオーバーライドすることを想定しています。
   * @param {string} content シリアライズしたブロックの内容。
   */
  finalizeLeafBlock(content) {
    return content;
  }

  /**
   * 引用の内容をフォーマットします。
   * 継承クラスでオーバーライドすることを想定しています。
   * @param {string} content 引用内のブロック要素をシリアライズした文字列。
   */
  formatBlockQuote(content) {
    return content;
  }

  /**
   * リスト項目の内容をフォーマットします。
   * 継承クラスでオーバーライドすることを想定しています。
   * @param {string} content 項目内のブロック要素をシリアライズした文字列。
   */
  formatItem(content) {
    return content;
  }

  /**
   * リスト全体をフォーマットします。
   * 継承クラスでオーバーライドすることを想定しています。
   * @param {string} content 子要素をシリアライズした文字列。
   */
  formatList(content) {
    return content;
  }

  /**
   * その他のブロック要素の内容をフォーマットします。
   * 継承クラスでオーバーライドすることを想定しています。
   * @param {string} content 子要素をシリアライズした文字列。
   */
  formatHtmlBlock(content) {
    return content;
  }

  /**
   * 他のブロックを包含するブロックの最終調整を行います。
   * 継承クラスでオーバーライドすることを想定しています。
   * @param {string} content シリアライズしたコンテナーの内容。
   */
  finalizeContainerBlock(content) {
    return content;
  }

  /**
   * テキストの内容をフォーマットします。
   * 継承クラスでオーバーライドすることを想定しています。
   * @param {string} content テキストの内容。
   */
  formatText(content) {
    return content;
  }

  /**
   * 改行をフォーマットします。
   * 継承クラスでオーバーライドすることを想定しています。
   * @param {string} content 要素内のテキスト。通常は空です。
   */
  formatLinebreak(content) {
    return content;
  }

  /**
   * リンクをフォーマットします。
   * 継承クラスでオーバーライドすることを想定しています。
   * @param {string} content リンク・テキストの内容。
   */
  formatLink(content) {
    return content;
  }

  /**
   * 画像をフォーマットします。
   * 継承クラスでオーバーライドすることを想定しています。
   * @param {string} content 代替テキストの内容。
   */
  formatImage(content) {
    return content;
  }

  /**
   * 強調の内容をフォーマットします。
   * 継承クラスでオーバーライドすることを想定しています。
   * @param {string} content 強調する内容。
   */
  formatEmphasis(content) {
    return content;
  }

  /**
   * 強い強調の内容をフォーマットします。
   * 継承クラスでオーバーライドすることを想定しています。
   * @param {string} content 強く強調する内容。
   */
  formatStrong(content) {
    return content;
  }

  /**
   * インライン・コードをフォーマットします。
   * 継承クラスでオーバーライドすることを想定しています。
   * @param {string} content コードの内容。
   */
  formatCodeSpan(content) {
    return content;
  }

  /**
   * その他のインライン要素の内容をフォーマットします。
   * 継承クラスでオーバーライドすることを想定しています。
   * @param {string} content インライン要素の内容。
   */
  formatHtmlInline(content) {
    return content;
  }

  /**
   * インラインの最終調整を行います。
   * 継承クラスでオーバーライドすることを想定しています。
   * @param {string} content シリアライズしたインラインの内容。
   */
  finalizeInline(content) {
    return content;
  }
}
