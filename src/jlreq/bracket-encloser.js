/**
 * @license MIT
 *
 * @fileoverview 括弧類を配置するクラス。
 */

export class BracketEncloser {
  /**
   * 括弧類を配置します。
   * 前後のテキストにおいての括弧類の出現状況を考慮します。
   * @param {string} precedingText 挿入位置の直前にあるテキスト。
   * @param {string} primaryOpen 優先的に使用する始め括弧類。
   * @param {string} secondaryOpen 代替として使用する始め括弧類。
   * @param {string} text 括弧を配置する対象のテキスト。
   * @param {string} secondaryClose 代替として使用する終わり括弧類。
   * @param {string} primaryClose 優先的に使用する終わり括弧類。
   */
  enclose(
    precedingText,
    primaryOpen,
    secondaryOpen,
    text,
    secondaryClose,
    primaryClose,
  ) {
    const bracketPatternSource = [
      primaryOpen,
      secondaryOpen,
      secondaryClose,
      primaryClose,
    ].map((bracket) => RegExp.escape(bracket)).join('|');

    const leadingMatch = new RegExp(bracketPatternSource).exec(text);
    const leadingBracket = !leadingMatch ? null : leadingMatch[0];
    if ([primaryOpen, primaryClose].includes(leadingBracket)) {
      return secondaryOpen + text + secondaryClose;
    }
    if ([secondaryOpen, secondaryClose].includes(leadingBracket)) {
      return primaryOpen + text + primaryClose;
    }

    const precedingBrackets = [];
    for (
      const bracket of precedingText.match(/\p{Ps}|\p{Pe}/gu) ?? []
    ) {
      if (
        !new RegExp(`^(?!${bracketPatternSource})\\p{Pe}$`, 'u')
          .test(bracket)
      ) {
        precedingBrackets.push(bracket);
        continue;
      }
      for (const bracket of precedingBrackets.toReversed()) {
        precedingBrackets.splice(-1, 1);
        if (!new RegExp(
          `^(?:${bracketPatternSource}|\\p{Pe})$`,
          'u',
        ).test(bracket)) {
          break;
        }
      }
    }

    let precedingBracket = null;
    for (const bracket of precedingBrackets.toReversed()) {
      if (
        new RegExp(`^(?:${bracketPatternSource})$`, 'u')
          .test(bracket)
      ) {
        precedingBracket = bracket;
        break;
      }
    }

    if (
      precedingBracket === primaryClose || precedingBracket === secondaryOpen
    ) {
      return primaryOpen + text + primaryClose;
    }
    if (
      precedingBracket === secondaryClose || precedingBracket === primaryOpen
    ) {
      return secondaryOpen + text + secondaryClose;
    }

    return primaryOpen + text + primaryClose;
  }
}
