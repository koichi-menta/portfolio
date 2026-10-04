import { useCallback, useEffect, useState } from "react";

// 文字を1文字ずつ表示していく。active になってから送り始め、complete で全文を一気に出す。
// onType は1文字進むたびに呼ばれる（効果音用）
export const useTypewriter = (
  text: string,
  active: boolean,
  msPerChar: number,
  onType?: (count: number) => void,
) => {
  const [count, setCount] = useState<number>(0);
  const isDone = count >= text.length;

  useEffect(() => {
    if (!active || isDone) return;
    const id = setTimeout(() => setCount((prev) => prev + 1), msPerChar);
    return () => clearTimeout(id);
  }, [active, isDone, count, msPerChar]);

  useEffect(() => {
    if (count > 0 && !isDone) onType?.(count);
    // onType の再生成で鳴り直さないよう、文字数の変化だけを見る
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  const complete = useCallback(() => setCount(text.length), [text]);

  return { shown: text.slice(0, count), isDone, complete };
};
