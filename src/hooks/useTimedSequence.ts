import { useCallback, useEffect, useState } from "react";

// 決まった時間ごとに次の段階へ進む演出の進行役。
// step は -1 で開始前、0〜長さ-1 で再生中、長さ以上で終了。
// next で今の段階を飛ばし、skip で最後まで飛ばせる。
export const useTimedSequence = (durations: number[]) => {
  const [step, setStep] = useState<number>(-1);
  const total = durations.length;

  useEffect(() => {
    if (step < 0 || step >= total) return;
    const id = setTimeout(() => setStep((prev) => prev + 1), durations[step]);
    return () => clearTimeout(id);
  }, [step, total, durations]);

  const start = useCallback(() => setStep(0), []);
  const next = useCallback(
    () => setStep((prev) => (prev >= 0 && prev < total ? prev + 1 : prev)),
    [total],
  );
  const skip = useCallback(() => setStep(total), [total]);

  return {
    step,
    isIdle: step < 0,
    isPlaying: step >= 0 && step < total,
    isDone: step >= total,
    start,
    next,
    skip,
  };
};
