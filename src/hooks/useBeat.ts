import { useEffect, useRef, useState } from "react";
import { playHat, playKick } from "src/lib/dopamineSound";

// 一定のテンポでキックとハイハットを鳴らし、拍ごとに増える数を返す。
// 見た目は返り値の変化に合わせて動かすので、音を消していても拍は刻まれ続ける。
export const useBeat = (
  bpm: number,
  active: boolean,
  muted: boolean,
): number => {
  const [beat, setBeat] = useState<number>(0);
  const mutedRef = useRef<boolean>(muted);
  mutedRef.current = muted;

  useEffect(() => {
    if (!active) return;
    const halfBeatMs = 60000 / bpm / 2;
    let step = 0;
    const tick = () => {
      if (step % 2 === 0) {
        if (!mutedRef.current) playKick();
        setBeat((prev) => prev + 1);
      } else if (!mutedRef.current) {
        playHat();
      }
      step++;
    };
    tick();
    const id = setInterval(tick, halfBeatMs);
    return () => clearInterval(id);
  }, [bpm, active]);

  return beat;
};
