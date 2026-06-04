/**
 * @license MIT
 *
 * @fileoverview 字下げを管理、調整するクラス。
 */

export class LineHeadIndenter {
  #oneEmSpace;

  /**
   * インスタンスを初期化します。
   * @param {string} oneEmSpace アキとして使用する文字列。
   */
  constructor(oneEmSpace = '\u3000') {
    this.#oneEmSpace = oneEmSpace;
  }

  /**
   * 指定した文字列の先頭行の字下げを行います。
   * 先頭行に始め括弧類を配置する場合は、空き量を自動的に一つ減らします。
   * @param {number} size 指定する字下げの空き量。
   * @param {string} text 字下げする対象の文字列。
   */
  indent(size, text) {
    const trimmed = text.trimStart();
    return this.#oneEmSpace
      .repeat(Math.max(size - (!/^\p{Ps}/u.test(trimmed) ? 0 : 1), 0))
      + trimmed;
  }
}
