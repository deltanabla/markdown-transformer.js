/**
 * @license MIT
 *
 * @fileoverview 行アキを最適化するクラス。
 */

export class LineSpacer {
  #newLine;

  /**
   * インスタンスを初期化します。
   * @param {string} newLine 改行文字列。
   */
  constructor(newLine = '\n') {
    this.#newLine = newLine;
  }

  /**
   * 必要な改行文字列を生成します。
   * 前後のテキストの改行状況をスキャンし、目標とする空き量を維持します。
   * @param {string} precedingText 前方のテキスト。
   * @param {number} lines 確保したい空き量
   * @param {string} followingText 後方のテキスト。
   */
  space(precedingText, lines, followingText = '') {
    const leadingNewLinesMatch = /[\r\n]+$/.exec(precedingText);
    const trailingNewLinesMatch = /^[\r\n]+/.exec(followingText);
    return this.#newLine.repeat(Math.max((
      lines + 1
      - (
        !leadingNewLinesMatch
          ? 0 : this.#countNewLines(leadingNewLinesMatch[0])
      )
      - (
        !trailingNewLinesMatch
          ? 0 : this.#countNewLines(trailingNewLinesMatch[0])
      )
    ), 0));
  }

  /**
   * 文字列内の改行の総数をカウントします。
   * @param {string} text 文字列。
   */
  #countNewLines(text) {
    return text.match(/\r?\n|\r/g)?.length ?? 0;
  }
}
