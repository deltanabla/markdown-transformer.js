/**
 * @license MIT
 *
 * @fileoverview Markdown変換フォームを制御します。
 */

import * as transformers from './../../../index.js';
import {SnackbarAttacher} from 'https://cdn.jsdelivr.net/gh/deltanabla/jl.css@0.0.0/index.js';

const COPY_COMMAND = '--dn12mt-copy';
setup(document.forms.dn12mt);

/**
 * 指定したフォームにイベント・リスナーを設定し、有効化します。
 * @param {!HTMLFormElement} form 初期化対象のフォーム。
 */
function setup(form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleSubmit(event.target);
  });
  form.addEventListener('reset', (event) => handleReset(event.target));

  new SnackbarAttacher().attach();
  document.addEventListener('command', handleCommand, true);

  for (
    const button of form
      .ownerDocument
      .querySelectorAll(`[command='${COPY_COMMAND}']`)
  ) {
    if (button instanceof HTMLButtonElement) {
      button.disabled = false;
    }
  }

  for (const formControl of form.elements) {
    if (('disabled' in formControl) && formControl.disabled === true) {
      formControl.disabled = false;
    }
  }
}

/**
 * フォームの送信イベントをハンドリングし、Markdown変換処理を開始します。
 * @param {!HTMLFormElement} form 送信したフォーム。
 */
function handleSubmit(form) {
  transformMarkdown(form.elements.markdown);
}

/**
 * フォームのリセット・イベントをハンドリングし、スナックバー非表示処理を開始します。
 * @param {!HTMLFormElement} form リセットしたフォーム。
 */
function handleReset(form) {
  dismissSnackbar(form.elements.snackbar);
}

/**
 * 入力した文字列をMarkdownとして変換し、結果を特定の出力エリアに反映します。
 * @param {!HTMLTextAreaElement} input Markdown入力欄。
 */
function transformMarkdown(input) {
  const markdown = new transformers.MarkdownTransformer(input.value);
  const main = input.form?.closest('main');

  /**
   * 指定したフォーマットでMarkdownを変換し、データ属性が一致する要素の内容を更新します。
   * @param {string} format 出力対象を識別するフォーマット識別子。
   * @param {!transformers.HtmlTransformer} transformer 使用する変換エンジン。
   */
  const transformBy = (format, transformer) => {
    const codes =
      main?.querySelectorAll(`[data-dn12mt-output='${format}']`);
    if (!codes?.length) {
      throw new Error(`出力対象［${format}］が見つかりません。`);
    }

    const result = markdown.transform(transformer);
    for (const code of codes) {
      code.textContent = result;
    }
  };
  try {
    transformBy('jlreq', new transformers.JlReqTransformer());
  } catch (error) {
    showSnackbarError(input.form.elements.snackbar, error);
    return;
  }

  showSnackbarSuccess(
    input.form.elements.snackbar,
    'Markdownの変換に成功しました。',
  );
}

/**
 * 指定したスナックバーを非表示にします。
 * @param {!HTMLElement} snackbar 非表示にするスナックバー。
 */
function dismissSnackbar(snackbar) {
  snackbar.hidePopover();
}

/**
 * コマンド・イベントをハンドリングし、コピー処理を開始します。
 * @param {!CommandEvent} event 発火したイベント。
 */
function handleCommand(event) {
  if (event.command === COPY_COMMAND) {
    copyElementText(event.target);
  }
}

/**
 * スナックバーにエラー・メッセージを表示します。
 * @param {!HTMLOutputElement} snackbar 表示対象のスナックバー。
 * @param {!Error} error 発生したエラー。
 */
function showSnackbarError(snackbar, error) {
  snackbar.hidePopover();
  snackbar.dataset.dn12mtStatus = 'error';
  snackbar.value = error.message;
  snackbar.showPopover();
}

/**
 * スナックバーのラベルのテキストを更新して画面に表示します。
 * すでに表示しているスナックバーは、一度非表示にします。
 * @param {!HTMLOutputElement} snackbar 表示対象のスナックバー。
 * @param {string} labelText スナックバーのラベルのテキスト。
 */

function showSnackbarSuccess(snackbar, labelText) {
  snackbar.hidePopover();
  snackbar.dataset.dn12mtStatus = 'success';
  snackbar.value = labelText;
  snackbar.showPopover();
}

/**
 * 指定した要素のテキストの内容をクリップボードにコピーします。
 * @param {!HTMLElement} target コピー対象のテキストを持つ要素。
 */
function copyElementText(target) {
  navigator.clipboard.writeText(target.textContent)
    .then(() => 'クリップボードにコピーしました。')
    .catch((error) => {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        return new Error(
          'クリップボードへ書き込むことができません。',
          {cause: error},
        );
      }

      return new Error(
        'クリップボードの操作中に失敗しました。',
        {cause: error},
      );
    })
    .then((labelText) => {
      const snackbars = target.ownerDocument
        .querySelectorAll(`output[popover][for~="${target.id}"]`);

      if (labelText instanceof Error) {
        for (const snackbar of snackbars) {
          showSnackbarError(snackbar, labelText);
        }
        return;
      }

      for (const snackbar of snackbars) {
        showSnackbarSuccess(snackbar, labelText);
      }
    });
}
