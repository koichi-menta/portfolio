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
import { MotionConfig, animate, motion } from "framer-motion";
import { TbPlayerTrackPrev, TbX } from "react-icons/tb";
import timelineData from "src/timeline.json";
import { GenreIcon } from "src/components/parts/GenreIcon";
import { DopamineButton } from "src/components/parts/DopamineButton";
import {
  DOPAMINE_CONTROLS_SAFE_AREA,
  useDopamineMode,
} from "src/contexts/DopamineMode";
import { useTimedSequence } from "src/hooks/useTimedSequence";
import { device } from "src/constants/breakpoints";
import { playPop, playRewind, unlock } from "src/lib/dopamineSound";

const REWIND_MS = 2200;
const INTRO_MS = 1000;

const parseDate = (date: string): Date => {
  const [y, m, d] = date.split("/").map(Number);
  return new Date(y, m - 1, d);
};

const pad = (n: number): string => String(n).padStart(2, "0");
const formatDate = (date: Date): string =>
  `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
const formatTime = (date: Date): string =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

// 画面上は新しい順（上が現在、下が過去）に並べる
const events = [...timelineData].reverse();
const oldestTime = parseDate(events[events.length - 1].date).getTime();

export type ContainerProps = {};
type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ className }: Props): JSX.Element => {
  const { isMuted } = useDopamineMode();
  const durations = useMemo(
    () => [REWIND_MS, ...events.map(() => INTRO_MS)],
    [],
  );
  const { step, isPlaying, isDone, start, skip } = useTimedSequence(durations);
  // 開いた時刻を基準にする。ライブ時計として毎秒更新
  const [now, setNow] = useState<Date>(() => new Date());
  const [displayTime, setDisplayTime] = useState<number>(() => Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 古い順に1つずつ紹介するので、step 1 が一番下（配列の最後）
  const introducedIndex = step >= 1 ? events.length - step : -1;
  const isIntroduced = (i: number): boolean =>
    isDone || (introducedIndex >= 0 && i >= introducedIndex);

  const replay = useCallback(() => {
    unlock();
    scrollRef.current?.scrollTo({ top: 0 });
    start();
  }, [start]);

  // ページを開いたら自動で始める
  useEffect(() => {
    start();
  }, [start]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // 巻き戻し: 線の先端を追いかけて下へスクロールしながら、日付を最古まで巻き戻す
  useEffect(() => {
    if (step !== 0) return;
    if (!isMuted) playRewind(REWIND_MS / 1000);
    const scroller = scrollRef.current;
    const maxScroll = scroller
      ? scroller.scrollHeight - scroller.clientHeight
      : 0;
    const controls = animate(0, 1, {
      duration: REWIND_MS / 1000,
      ease: "easeInOut",
      onUpdate: (progress) => {
        setDisplayTime(Date.now() - (Date.now() - oldestTime) * progress);
        if (scroller) scroller.scrollTop = maxScroll * progress;
      },
    });
    return () => controls.stop();
    // isMuted の切り替えで巻き戻しをやり直さない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // 紹介: 対象の出来事を画面中央へ寄せて、その日付を表示する
  useEffect(() => {
    if (introducedIndex < 0) return;
    if (!isMuted) playPop();
    setDisplayTime(parseDate(events[introducedIndex].date).getTime());
    itemRefs.current[introducedIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introducedIndex]);

  useEffect(() => {
    if (isDone) scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [isDone]);

  const isRewinding = step === 0;

  return (
    <MotionConfig reducedMotion="user">
      <div className={className}>
        <div className="display">
          <Link href="/" className="close" aria-label="トップページに戻る">
            <TbX size={22} />
          </Link>
          <p className={clsx("clock", isRewinding && "rewinding")}>
            {isRewinding && <TbPlayerTrackPrev className="rewindIcon" />}
            {isPlaying ? formatDate(new Date(displayTime)) : formatDate(now)}
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

        <div className="scroller" ref={scrollRef}>
          <div className="track">
            {/* 巻き戻しのたびに作り直して、縮んだ状態から伸ばす */}
            <motion.div
              key={isRewinding ? "rewind" : "static"}
              className="line"
              style={{ originY: 0 }}
              initial={isRewinding ? { scaleY: 0 } : false}
              animate={{ scaleY: 1 }}
              transition={{
                duration: isRewinding ? REWIND_MS / 1000 : 0,
                ease: "easeInOut",
              }}
            />

            <div className="now">
              <span className="nowNode" />
              <div className="nowBody">
                <p className="nowLabel">NOW</p>
                <p className="nowTime">
                  {formatDate(now)} {formatTime(now)}
                </p>
                {isDone && (
                  <motion.div
                    className="replay"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <DopamineButton onClick={replay}>
                      もう一度見る
                    </DopamineButton>
                  </motion.div>
                )}
              </div>
            </div>

            {events.map((event, i) => (
              <div
                key={event.title}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                className={clsx(
                  "event",
                  isIntroduced(i) && "introduced",
                  i === introducedIndex && "current",
                )}
              >
                <span className="node">
                  <GenreIcon genre={event.genre} />
                </span>
                <motion.div
                  className="card"
                  animate={
                    isIntroduced(i)
                      ? {
                          opacity: 1,
                          x: 0,
                          scale: i === introducedIndex ? 1.04 : 1,
                        }
                      : { opacity: 0.15, x: 24, scale: 1 }
                  }
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                >
                  <p className="date">{event.date}</p>
                  <p className="title">{event.title}</p>
                  <p className="description">{event.description}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MotionConfig>
  );
};

const rainbow = `red, orange, yellow, lime, cyan, blue, magenta, red`;
const DISPLAY_HEIGHT = 64;

// タイムマシンのように画面全体を使う
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
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    height: ${DISPLAY_HEIGHT}px;
    padding: 0 12px;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
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
      @media (${device.tablet}) {
        font-size: 28px;
        letter-spacing: 2px;
      }
      text-shadow: 0 0 10px rgba(120, 220, 255, 0.9);
      &.rewinding {
        color: #ff9ad5;
        text-shadow: 0 0 10px rgba(255, 106, 213, 0.9);
      }
      > .rewindIcon {
        animation: timeline-blink 0.4s steps(1) infinite;
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

  > .scroller {
    flex: 1;
    overflow-y: auto;
    padding-bottom: ${DOPAMINE_CONTROLS_SAFE_AREA}px;
  }

  .track {
    position: relative;
    max-width: 640px;
    margin: 0 auto;
    padding: 24px 16px 48px 64px;

    > .line {
      position: absolute;
      top: 40px;
      bottom: 48px;
      left: 39px;
      width: 4px;
      border-radius: 2px;
      background: linear-gradient(180deg, ${rainbow});
      box-shadow: 0 0 12px rgba(255, 106, 213, 0.8);
    }
  }

  .now {
    position: relative;
    margin-bottom: 40px;
    > .nowNode {
      position: absolute;
      top: 6px;
      left: -34px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 0 16px 4px rgba(120, 220, 255, 0.9);
    }
    > .nowBody {
      > .nowLabel {
        font-size: 22px;
        font-weight: 900;
        color: #7fdcff;
      }
      > .nowTime {
        font-family: "Courier New", monospace;
        font-size: 14px;
        opacity: 0.8;
      }
      > .replay {
        margin-top: 16px;
      }
    }
  }

  .event {
    position: relative;
    margin-bottom: 32px;
    > .node {
      position: absolute;
      top: 8px;
      left: -42px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #333;
      color: #888;
      transition: 0.3s;
    }
    &.introduced > .node {
      background: #fff;
      color: #333;
      box-shadow: 0 0 12px 2px rgba(255, 255, 255, 0.8);
    }
    &.current > .node {
      box-shadow: 0 0 20px 6px rgba(255, 106, 213, 0.9);
    }
    > .card {
      padding: 12px 16px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.08);
      > .date {
        font-family: "Courier New", monospace;
        font-size: 13px;
        color: #7fdcff;
      }
      > .title {
        margin-top: 2px;
        font-size: 16px;
        font-weight: bold;
      }
      > .description {
        margin-top: 6px;
        font-size: 14px;
        line-height: 1.6;
        opacity: 0.85;
      }
    }
    &.current > .card {
      border: 2px solid transparent;
      background:
        linear-gradient(#24124a, #24124a) padding-box,
        linear-gradient(135deg, ${rainbow}) border-box;
    }
  }

  @keyframes timeline-blink {
    50% {
      opacity: 0;
    }
  }
`;

export const TimelineTimeMachine = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};
