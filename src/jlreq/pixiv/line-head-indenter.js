/**
 * @license MIT
 *
 * @fileoverview pixiv小説記法の字下げを管理、調整するクラス。
 */

import {LineHeadIndenter as JlreqIndenter} from '../line-head-indenter.js';

export class LineHeadIndenter extends JlreqIndenter {
  indent(size, text) {
    return super.indent(
      !/^\s*\[(?:(?:uploadedimage|pixivimage|jump|b|i)|\[(?:jumpuri|rb|emphasismark)):/
        .test(text)
        ? size
        : size + 1,
      text,
    );
  }
}
