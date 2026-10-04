import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styled from "styled-components";
import clsx from "clsx";
import Link from "next/link";
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { TbFlag, TbPlayerTrackPrev, TbX } from "react-icons/tb";
import timelineData from "src/timeline.json";
import { GenreIcon } from "src/components/parts/GenreIcon";
import { DopamineButton } from "src/components/parts/DopamineButton";
import { device } from "src/constants/breakpoints";
import {
  DOPAMINE_CONTROLS_SAFE_AREA,
  useDopamineMode,
} from "src/contexts/DopamineMode";
import { useTimedSequence } from "src/hooks/useTimedSequence";
import { playPop, playReveal, playRewind, unlock } from "src/lib/dopamineSound";

// 最新の出来事のアップで一拍置いてから、山道を下って過去へ戻る
const REWIND_HOLD_MS = 500;
const REWIND_MOVE_MS = 2200;
const INTRO_MS = 1000;
const NOW_MS = 1500;
// ホイール1回の操作で何か所も飛ばないよう、移動後しばらく入力を無視する
const NAVIGATION_LOCK_MS = 700;
const SWIPE_THRESHOLD_PX = 50;

// 山の絵の座標系。頂上が最新、ふもとが一番過去
const WORLD_WIDTH = 1000;
// ふもとをアップにしても絵が途切れないよう、山すそを下まで伸ばしておく
const WORLD_HEIGHT = 1700;
const SUMMIT = { x: 500, y: 200 };
// 最後に NOW を映すときの注目点（旗のあたり）
const NOW_POINT = { x: 500, y: 90 };
const FOOT = { x: 500, y: 1350 };
// 古い順に、ふもとから頂上へ向かう山道の曲がり角に置く
const EVENT_POINTS = [
  { x: 320, y: 1230 },
  { x: 650, y: 1080 },
  { x: 380, y: 930 },
  { x: 610, y: 780 },
  { x: 430, y: 630 },
  { x: 570, y: 480 },
];

type Point = { x: number; y: number };

const distance = (a: Point, b: Point): number =>
  Math.hypot(a.x - b.x, a.y - b.y);

const polylineLength = (points: Point[]): number =>
  points.slice(1).reduce((sum, p, i) => sum + distance(points[i], p), 0);

// 折れ線上を progress(0〜1) だけ進んだ位置
const pointOnPolyline = (points: Point[], progress: number): Point => {
  let remaining = polylineLength(points) * progress;
  for (let i = 1; i < points.length; i++) {
    const segment = distance(points[i - 1], points[i]);
    if (remaining <= segment) {
      const t = segment === 0 ? 0 : remaining / segment;
      return {
        x: points[i - 1].x + (points[i].x - points[i - 1].x) * t,
        y: points[i - 1].y + (points[i].y - points[i - 1].y) * t,
      };
    }
    remaining -= segment;
  }
  return points[points.length - 1];
};

// 光る山道は頂上から下へ向かって描く
const LIT_TRAIL = [SUMMIT, ...[...EVENT_POINTS].reverse(), FOOT];
// 巻き戻しは山頂の NOW から山道を下ってふもとの一番古い出来事へ
const REWIND_ROUTE = [NOW_POINT, SUMMIT, ...[...EVENT_POINTS].reverse()];
const toPathD = (points: Point[]): string =>
  points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");

const parseDate = (date: string): Date => {
  const [y, m, d] = date.split("/").map(Number);
  return new Date(y, m - 1, d);
};
const pad = (n: number): string => String(n).padStart(2, "0");
const formatDate = (date: Date): string =>
  `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
const formatTime = (date: Date): string =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

const oldestTime = parseDate(timelineData[0].date).getTime();

type Size = { width: number; height: number };

export type ContainerProps = {};
type Props = {
  className?: string;
} & ContainerProps;

// 寄って見られる場所。古い順の出来事のあとに、頂上の NOW
const STOP_POINTS = [...EVENT_POINTS, NOW_POINT];
const NOW_STOP = STOP_POINTS.length - 1;
// 見て回るとき、NOW の上と一番古い出来事の下は山全体の俯瞰
const OVERVIEW_TOP = NOW_STOP + 1;
const OVERVIEW_BOTTOM = -1;
const BROWSE_POSITIONS = Array.from(
  { length: OVERVIEW_TOP - OVERVIEW_BOTTOM + 1 },
  (_, i) => OVERVIEW_TOP - i,
);
// 俯瞰で収める範囲（NOW の旗からふもとまで）
const FIT_TOP = 20;
const FIT_BOTTOM = 1380;
// 俯瞰のとき、画面下のヒントと「もう一度見る」と重ならないよう空けておく高さ
const HUD_RESERVE = 120;

const Component = ({ className }: Props): JSX.Element => {
  const { isMuted } = useDopamineMode();
  const isMutedRef = useRef(isMuted);
  const rewindAudioRef = useRef<ReturnType<typeof playRewind>>();
  const stopRewindAudio = useCallback(() => {
    rewindAudioRef.current?.stop();
    rewindAudioRef.current = undefined;
  }, []);
  useEffect(() => {
    isMutedRef.current = isMuted;
    if (isMuted) stopRewindAudio();
  }, [isMuted, stopRewindAudio]);
  const shouldReduceMotion = useReducedMotion();
  const durations = useMemo(
    () => [
      REWIND_HOLD_MS + REWIND_MOVE_MS,
      ...timelineData.map(() => INTRO_MS),
      NOW_MS,
    ],
    [],
  );
  const { step, isPlaying, isDone, start, skip } = useTimedSequence(durations);
  const [now, setNow] = useState<Date>(() => new Date());
  const [displayTime, setDisplayTime] = useState<number>(() => Date.now());
  const [isRewindMoving, setIsRewindMoving] = useState<boolean>(false);
  // 終わった後にスクロールやタップで寄る場所
  const [browseStop, setBrowseStop] = useState<number>(NOW_STOP);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const browseStopRef = useRef<number>(NOW_STOP);
  const lockedUntilRef = useRef<number>(0);
  const touchStartYRef = useRef<number | null>(null);

  const cameraX = useMotionValue(0);
  const cameraY = useMotionValue(0);
  const cameraScale = useMotionValue(1);
  const litLength = useMotionValue(0);
  // 長さ0でも線の丸い端が点として残るので、光り始めるまでは隠す
  const litOpacity = useTransform(litLength, (v) => (v > 0.001 ? 1 : 0));

  // 紹介中は step 1 がふもと（配列の先頭）、最後の step が頂上の NOW
  const currentStop = isDone ? browseStop : step >= 1 ? step - 1 : -1;
  const isOverview =
    isDone && (browseStop === OVERVIEW_TOP || browseStop === OVERVIEW_BOTTOM);
  const isLit = (i: number): boolean =>
    isDone || (currentStop >= 0 && i <= currentStop);
  const focusedEvent =
    currentStop >= 0 && currentStop < NOW_STOP
      ? timelineData[currentStop]
      : null;
  const isNowFocused = currentStop === NOW_STOP;

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const closeUpScale = Math.min(size.width, size.height) / 360;
  // 注目点のすぐ下に日付・出来事をまとめたカードを置く
  const closeUpAnchor = 0.3;
  const eventPanelTop = DISPLAY_HEIGHT + size.height * closeUpAnchor + (isNowFocused ? 40 : 28) * closeUpScale + 12;

  const cameraFor = useCallback(
    (point: Point, scale: number, anchorY: number) => ({
      x: size.width / 2 - point.x * scale,
      y: size.height * anchorY - point.y * scale,
      scale,
    }),
    [size],
  );

  const moveCamera = useCallback(
    (point: Point, scale: number, anchorY: number) => {
      const target = cameraFor(point, scale, anchorY);
      const options = shouldReduceMotion
        ? { duration: 0 }
        : { type: "spring" as const, stiffness: 120, damping: 20 };
      animate(cameraX, target.x, options);
      animate(cameraY, target.y, options);
      animate(cameraScale, target.scale, options);
    },
    [cameraFor, cameraX, cameraY, cameraScale, shouldReduceMotion],
  );

  const goToStop = useCallback((index: number) => {
    const clamped = Math.max(OVERVIEW_BOTTOM, Math.min(OVERVIEW_TOP, index));
    browseStopRef.current = clamped;
    setBrowseStop(clamped);
  }, []);

  // スクロールの向きと山の上下を合わせる: 下へ = ふもと（過去）へ、上へ = 頂上（現在）へ
  const browse = useCallback(
    (direction: 1 | -1) => {
      const now = Date.now();
      if (now < lockedUntilRef.current) return;
      const next = browseStopRef.current - direction;
      if (next < OVERVIEW_BOTTOM || next > OVERVIEW_TOP) return;
      lockedUntilRef.current = now + NAVIGATION_LOCK_MS;
      goToStop(next);
    },
    [goToStop],
  );

  const replay = useCallback(() => {
    unlock();
    // 終わった瞬間に前回見ていた場所へ一瞬寄らないよう、NOW に戻しておく
    goToStop(NOW_STOP);
    start();
  }, [goToStop, start]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // 画面の大きさが分かってから始める
  useEffect(() => {
    if (size.width > 0 && step === -1) start();
  }, [size.width, step, start]);

  // 終わったら頂上の NOW のアップのまま、そこからスクロールで見て回れるようにする
  useEffect(() => {
    if (isDone) goToStop(NOW_STOP);
  }, [isDone, goToStop]);

  // 巻き戻し: 山頂の NOW のアップから、山道を下ってふもとの一番古い出来事へ
  useEffect(() => {
    if (step !== 0 || size.width === 0) return;
    const startCamera = cameraFor(NOW_POINT, closeUpScale, 0.5);
    cameraX.set(startCamera.x);
    cameraY.set(startCamera.y);
    cameraScale.set(startCamera.scale);
    litLength.set(0);
    const startTime = Date.now();
    setDisplayTime(startTime);
    setIsRewindMoving(false);

    const totalLit = polylineLength(LIT_TRAIL);
    // 旗から山頂までは山道ではないので、光る道はその先から数える
    const flagToSummit = distance(NOW_POINT, SUMMIT);
    const routeLength = polylineLength(REWIND_ROUTE);
    let controls: ReturnType<typeof animate> | undefined;

    const holdId = setTimeout(() => {
      setIsRewindMoving(true);
      if (!isMutedRef.current) {
        rewindAudioRef.current = playRewind(REWIND_MOVE_MS / 1000);
      }
      controls = animate(0, 1, {
        duration: shouldReduceMotion ? 0 : REWIND_MOVE_MS / 1000,
        ease: "easeInOut",
        onUpdate: (progress) => {
          const point = pointOnPolyline(REWIND_ROUTE, progress);
          // 下りながら少し引いて、山道の流れが見えるようにする
          const scale =
            closeUpScale * (1 - 0.35 * Math.sin(progress * Math.PI));
          const camera = cameraFor(point, scale, 0.5);
          cameraX.set(camera.x);
          cameraY.set(camera.y);
          cameraScale.set(camera.scale);
          litLength.set(
            Math.max(0, routeLength * progress - flagToSummit) / totalLit,
          );
          setDisplayTime(startTime - (startTime - oldestTime) * progress);
        },
      });
    }, REWIND_HOLD_MS);

    return () => {
      clearTimeout(holdId);
      controls?.stop();
      stopRewindAudio();
    };
    // 巻き戻しの開始時に一度だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, size.width, shouldReduceMotion]);

  // 紹介中も終わった後も、注目する場所が変わったらそこへ寄る
  useEffect(() => {
    if (size.width === 0) return;
    if (isOverview) {
      const fitAreaHeight = Math.max(size.height - HUD_RESERVE, 0);
      const fitScale =
        Math.min(
          size.width / WORLD_WIDTH,
          fitAreaHeight / (FIT_BOTTOM - FIT_TOP),
        ) * 0.92;
      moveCamera(
        { x: WORLD_WIDTH / 2, y: (FIT_TOP + FIT_BOTTOM) / 2 },
        fitScale,
        fitAreaHeight / 2 / size.height,
      );
      return;
    }
    if (currentStop < 0) return;
    moveCamera(STOP_POINTS[currentStop], closeUpScale, closeUpAnchor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStop, isOverview, size]);

  // 注目する場所が変わった時の音と日付。
  // 「デン！」は最初のアニメーションで NOW にたどり着いた時だけ。見て回る時はどこでも同じ音
  useEffect(() => {
    if (isOverview) {
      if (!isMuted) playPop();
      return;
    }
    if (currentStop < 0) return;
    setIsRewindMoving(false);
    if (currentStop === NOW_STOP) {
      animate(litLength, 1, { duration: 0.4 });
      setDisplayTime(Date.now());
    } else {
      setDisplayTime(parseDate(timelineData[currentStop].date).getTime());
    }
    if (isMuted) return;
    if (currentStop === NOW_STOP && isPlaying) playReveal();
    else playPop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStop]);

  // 終わった後の見て回る操作: ホイール・スワイプ・矢印キー
  useEffect(() => {
    if (!isDone) return;
    const viewport = viewportRef.current;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.deltaY === 0) return;
      e.preventDefault();
      if (Math.abs(e.deltaY) < 10) return;
      browse(e.deltaY > 0 ? 1 : -1);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      // The event panel is independently scrollable on short viewports. Keep
      // arrow keys native while reading it instead of replacing the event.
      if (e.target instanceof Element && e.target.closest(".eventCard")) return;
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      browse(e.key === "ArrowDown" ? 1 : -1);
    };
    // ページ自体がスクロールしないよう preventDefault するため、passive: false で登録する
    viewport?.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      viewport?.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDone, browse]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDone || touchStartYRef.current === null) return;
    // 指を上へ払う = 下へスクロール
    const deltaY = touchStartYRef.current - e.changedTouches[0].clientY;
    touchStartYRef.current = null;
    if (Math.abs(deltaY) < SWIPE_THRESHOLD_PX) return;
    browse(deltaY > 0 ? 1 : -1);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className={className}>
        <div className="display">
          <Link href="/" className="close" aria-label="トップページに戻る">
            <TbX size={22} />
          </Link>
          <p className={clsx("clock", isRewindMoving && "rewinding")}>
            {isRewindMoving && <TbPlayerTrackPrev className="rewindIcon" />}
            {isPlaying && !isNowFocused
              ? formatDate(new Date(displayTime))
              : formatDate(now)}
          </p>
          {isPlaying ? (
            <button type="button" className="skip" onClick={skip}>
              スキップ ≫
            </button>
          ) : (
            // ✕ と釣り合わせて日付を中央に保つ
            <span className="spacer" />
          )}
        </div>

        <div
          className="viewport"
          ref={viewportRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <motion.div
            className="world"
            style={{ x: cameraX, y: cameraY, scale: cameraScale }}
          >
            <svg
              className="mountain"
              viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}
              width={WORLD_WIDTH}
              height={WORLD_HEIGHT}
            >
              <defs>
                <linearGradient id="mountainFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5b3aa8" />
                  <stop offset="100%" stopColor="#1a0f3a" />
                </linearGradient>
                <linearGradient id="trailRainbow" x1="0" y1="0" x2="0" y2="1">
                  {[
                    "red",
                    "orange",
                    "yellow",
                    "lime",
                    "cyan",
                    "blue",
                    "magenta",
                  ].map((color, i) => (
                    <stop
                      key={color}
                      offset={`${(i / 6) * 100}%`}
                      stopColor={color}
                    />
                  ))}
                </linearGradient>
              </defs>
              <polygon
                points="0,1700 0,1420 160,1020 290,1090 500,150 720,1000 850,930 1000,1420 1000,1700"
                fill="url(#mountainFill)"
              />
              {/* 頂上の雪 */}
              <polygon
                points="500,150 430,400 470,370 500,415 535,365 575,395"
                fill="#efeaff"
              />
              <path d={toPathD(LIT_TRAIL)} className="trailBase" fill="none" />
              <motion.path
                d={toPathD(LIT_TRAIL)}
                className="trailLit"
                fill="none"
                style={{ pathLength: litLength, opacity: litOpacity }}
              />
            </svg>

            {/* 雪の頂（y=150）より上に旗を立てる */}
            <button
              type="button"
              className={clsx("summit", isNowFocused && "focused")}
              style={{ left: SUMMIT.x, top: 130 }}
              disabled={!isDone}
              onClick={() => isDone && goToStop(NOW_STOP)}
            >
              <TbFlag className="flag" />
              <span className="nowLabel">NOW</span>
            </button>

            {timelineData.map((event, i) => (
              <button
                type="button"
                key={event.title}
                className={clsx(
                  "node",
                  isLit(i) && "lit",
                  i === currentStop && "focused",
                )}
                style={{ left: EVENT_POINTS[i].x, top: EVENT_POINTS[i].y }}
                aria-label={event.title}
                disabled={!isDone}
                onClick={() => isDone && goToStop(i)}
              >
                <GenreIcon genre={event.genre} />
                <span className="nodeDate">{event.date}</span>
              </button>
            ))}
          </motion.div>

          {isDone && (
            <div className="stops" aria-hidden>
              {/* 上が頂上（現在）、下がふもと（過去） */}
              {BROWSE_POSITIONS.map((position) => (
                <span
                  key={position}
                  className={clsx(
                    "dot",
                    (position === OVERVIEW_TOP ||
                      position === OVERVIEW_BOTTOM) &&
                      "overview",
                    position === browseStop && "active",
                  )}
                />
              ))}
            </div>
          )}
        </div>

        <div className="hud" style={{
          "--event-panel-top": `${eventPanelTop}px`,
          "--event-panel-reserve": `${isDone ? 104 : 16}px`,
        } as React.CSSProperties}>
          <AnimatePresence mode="wait">
            {focusedEvent && (
              <motion.article
                key={focusedEvent.title}
                className="card eventCard"
                tabIndex={0}
                aria-label={`${focusedEvent.date} ${focusedEvent.title}`}
                initial={{ y: 40, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -20, opacity: 0, transition: { duration: 0.12 } }}
                transition={{ type: "spring", stiffness: 400, damping: 26 }}
              >
                <time className="date" dateTime={formatDate(parseDate(focusedEvent.date)).replace(/\//g, "-")}>{focusedEvent.date}</time>
                <p className="title">{focusedEvent.title}</p>
                <p className="description">{focusedEvent.description}</p>
              </motion.article>
            )}
            {isNowFocused && (
              <motion.div
                key="now"
                className="card eventCard nowCard"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ y: -20, opacity: 0, transition: { duration: 0.12 } }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
              >
                <p className="hello">Hello World</p>
                <p className="date">
                  NOW {formatDate(now)} {formatTime(now)}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {isDone && (
            <motion.div
              className="ending"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <p className="hint">スクロール・スワイプで山を上り下り</p>
              <DopamineButton onClick={replay}>もう一度見る</DopamineButton>
            </motion.div>
          )}
        </div>
      </div>
    </MotionConfig>
  );
};

const rainbow = `red, orange, yellow, lime, cyan, blue, magenta, red`;
const DISPLAY_HEIGHT = 64;

const StyledComponent = styled(Component)`
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  flex-direction: column;
  background: radial-gradient(circle at 50% 0%, #2a1650, #0b0820 70%);
  color: #fff;

  > .display {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    height: ${DISPLAY_HEIGHT}px;
    flex-shrink: 0;
    padding: 0 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(11, 8, 32, 0.6);
    > .close {
      display: flex;
      color: #fff;
    }
    > .spacer {
      width: 22px;
    }
    > .clock {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: "Courier New", monospace;
      font-size: 20px;
      font-weight: bold;
      letter-spacing: 1px;
      text-shadow: 0 0 10px rgba(120, 220, 255, 0.9);
      @media (${device.tablet}) {
        font-size: 28px;
        letter-spacing: 2px;
      }
      &.rewinding {
        color: #ff9ad5;
        text-shadow: 0 0 10px rgba(255, 106, 213, 0.9);
      }
      > .rewindIcon {
        animation: mountain-blink 0.4s steps(1) infinite;
      }
    }
    > .skip {
      flex-shrink: 0;
      padding: 6px 14px;
      border: 1px solid rgba(255, 255, 255, 0.6);
      border-radius: 999px;
      background: rgba(0, 0, 0, 0.3);
      color: #fff;
      font-size: 12px;
      cursor: pointer;
    }
  }

  > .viewport {
    position: relative;
    flex: 1;
    overflow: hidden;
    margin-bottom: ${DOPAMINE_CONTROLS_SAFE_AREA}px;
  }

  .world {
    position: absolute;
    top: 0;
    left: 0;
    width: ${WORLD_WIDTH}px;
    height: ${WORLD_HEIGHT}px;
    transform-origin: 0 0;
    > .mountain {
      position: absolute;
      inset: 0;
      .trailBase {
        stroke: rgba(255, 255, 255, 0.2);
        stroke-width: 10;
        stroke-dasharray: 4 18;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .trailLit {
        stroke: url(#trailRainbow);
        stroke-width: 12;
        stroke-linecap: round;
        stroke-linejoin: round;
        filter: drop-shadow(0 0 8px rgba(255, 106, 213, 0.9));
      }
    }
  }

  .summit {
    position: absolute;
    translate: -50% -100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0;
    border: none;
    background: none;
    color: #7fdcff;
    cursor: pointer;
    > .flag {
      font-size: 64px;
      filter: drop-shadow(0 0 10px rgba(127, 220, 255, 0.9));
    }
    > .nowLabel {
      font-size: 40px;
      font-weight: 900;
    }
    &.focused > .flag {
      filter: drop-shadow(0 0 24px rgba(255, 106, 213, 1));
    }
  }

  .stops {
    position: absolute;
    top: 50%;
    right: 10px;
    translate: 0 -50%;
    display: flex;
    flex-direction: column;
    gap: 6px;
    > .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transition: 0.3s;
      /* 両端の俯瞰は中抜きの丸で区別する */
      &.overview {
        border: 1px solid rgba(255, 255, 255, 0.5);
        background: transparent;
      }
      &.active {
        height: 18px;
        border-radius: 3px;
        background: #ff6ad5;
      }
    }
  }

  .node {
    position: absolute;
    translate: -50% -50%;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    padding: 0;
    border: 3px solid #555;
    border-radius: 50%;
    background: #2a2440;
    color: #888;
    font-size: 26px;
    cursor: pointer;
    transition:
      background 0.3s,
      color 0.3s,
      box-shadow 0.3s;
    > .nodeDate {
      position: absolute;
      top: calc(100% + 6px);
      white-space: nowrap;
      font-family: "Courier New", monospace;
      font-size: 22px;
      color: rgba(255, 255, 255, 0.7);
    }
    &.lit {
      border-color: #fff;
      background: #fff;
      color: #333;
      box-shadow: 0 0 16px 4px rgba(255, 255, 255, 0.7);
    }
    &.focused {
      box-shadow: 0 0 24px 10px rgba(255, 106, 213, 0.9);
      > .nodeDate { visibility: hidden; }
    }
  }

  > .hud {
    position: absolute;
    left: 0;
    right: 0;
    bottom: ${DOPAMINE_CONTROLS_SAFE_AREA + 8}px;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 0 16px;
    pointer-events: none;
    > * {
      pointer-events: auto;
    }
    .card {
      width: 100%;
      max-width: 520px;
      padding: 14px 18px;
      border: 2px solid transparent;
      border-radius: 14px;
      background:
        linear-gradient(#24124a, #24124a) padding-box,
        linear-gradient(135deg, red, orange, yellow, lime, cyan, blue, magenta)
          border-box;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
      > .date {
        font-family: "Courier New", monospace;
        font-size: 14px;
        color: #7fdcff;
      }
      > .title {
        margin-top: 2px;
        font-size: 18px;
        font-weight: bold;
      }
      > .description {
        margin-top: 6px;
        font-size: 14px;
        line-height: 1.6;
        opacity: 0.85;
      }
    }
    .eventCard {
      position: fixed;
      top: var(--event-panel-top);
      left: max(16px, calc((100vw - 520px) / 2));
      right: max(16px, calc((100vw - 520px) / 2));
      width: auto;
      max-width: none;
      max-height: max(100px, calc(100dvh - var(--event-panel-top) - ${DOPAMINE_CONTROLS_SAFE_AREA + 8}px - var(--event-panel-reserve)));
      overflow-y: auto;
      overscroll-behavior: contain;
      > .date { display: block; font-size: clamp(20px, 3vw, 28px); font-weight: bold; line-height: 1.2; }
      > .title { margin-top: 6px; }
    }
    .nowCard {
      text-align: center;
      > .hello {
        font-size: 34px;
        font-weight: 900;
        background: linear-gradient(90deg, ${rainbow});
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
    }
    .ending {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      > .hint {
        font-size: 12px;
        opacity: 0.7;
      }
    }
  }

  @keyframes mountain-blink {
    50% {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .rewindIcon { animation: none !important; }
  }
`;

export const TimelineMountain = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};
