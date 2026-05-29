/// <reference lib="webworker" />

/**
 * JSON parse / stringify を別スレッドで実行する Worker。
 * 巨大 JSON 入力時にメインスレッドが固まる事故を防ぐ。
 *
 * メイン側は postMessage で `{ input, indent }` を送り、
 * `{ ok: true, result } | { ok: false, error }` を受け取る。
 */

type Indent = 2 | 4 | undefined;

interface RequestMessage {
  input: string;
  indent: Indent;
}

type ResponseMessage =
  | { ok: true; result: string }
  | { ok: false; error: string };

self.onmessage = (e: MessageEvent<RequestMessage>) => {
  const { input, indent } = e.data;
  let response: ResponseMessage;
  try {
    const parsed = JSON.parse(input);
    response = { ok: true, result: JSON.stringify(parsed, null, indent) };
  } catch (err) {
    response = { ok: false, error: err instanceof Error ? err.message : "Invalid JSON" };
  }
  self.postMessage(response);
};
