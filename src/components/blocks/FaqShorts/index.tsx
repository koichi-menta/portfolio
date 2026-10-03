import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import Image from "next/image";
import Link from "next/link";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from "framer-motion";
import { TbChevronDown, TbChevronUp, TbUserCircle, TbX } from "react-icons/tb";
import profile_image from "public/profile_icon.jpeg";
import faqData from "src/faq.json";
import { device } from "src/constants/breakpoints";
import { DopamineButton } from "src/components/parts/DopamineButton";
import {
  DOPAMINE_CONTROLS_SAFE_AREA,
  useDopamineMode,
} from "src/contexts/DopamineMode";
import { useTypewriter } from "src/hooks/useTypewriter";
import { playPop, playTick, unlock } from "src/lib/dopamineSound";

const MS_PER_CHAR = 30;
// 「質問きてた！」→質問→アイコンと順に出てから回答を話し始める
const ANSWER_START_MS = 900;
// ホイール1回の操作で何問も飛ばないよう、切り替え後しばらく入力を無視する
const NAVIGATION_LOCK_MS = 700;
const SWIPE_THRESHOLD_PX = 50;

type SlideProps = {
  question: string;
  answer: string;
  isLast: boolean;
  isMuted: boolean;
  onReplay: () => void;
};

const Slide = ({
  question,
  answer,
  isLast,
  isMuted,
  onReplay,
}: SlideProps): JSX.Element => {
  const shouldReduceMotion = useReducedMotion();
  const [isAnswering, setIsAnswering] = useState<boolean>(false);
  const handleType = useCallback(
    (count: number) => {
      if (!isMuted && count % 3 === 0) playTick();
    },
    [isMuted],
  );
  const { shown, isDone, complete } = useTypewriter(
    answer,
    isAnswering,
    MS_PER_CHAR,
    handleType,
  );

  useEffect(() => {
    if (!isMuted) playPop();
    if (shouldReduceMotion) {
      complete();
      return;
    }
    const id = setTimeout(() => setIsAnswering(true), ANSWER_START_MS);
    return () => clearTimeout(id);
    // 表示された時に一度だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div className="slide" onClick={complete}>
      <motion.p
        className="banner"
        initial={{ scale: 0, rotate: -12 }}
        animate={{ scale: 1, rotate: -4 }}
        transition={{ type: "spring", stiffness: 500, damping: 15 }}
      >
        質問きてた！
      </motion.p>
      <motion.div
        className="questionCard"
        initial={{ y: 30, opacity: 0, rotate: 0 }}
        animate={{ y: 0, opacity: 1, rotate: -2 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
      >
        <div className="commenter">
          <TbUserCircle size={20} />
          <span>匿名さん</span>
        </div>
        <p className="question">{question}</p>
      </motion.div>
      <motion.div
        className="avatar"
        initial={{ scale: 0 }}
        animate={
          isAnswering && !isDone
            ? { scale: 1, y: [0, -6, 0], rotate: [0, -3, 3, 0] }
            : { scale: 1, y: 0, rotate: 0 }
        }
        transition={
          isAnswering && !isDone
            ? { duration: 0.5, repeat: Infinity }
            : { delay: 0.5, type: "spring", stiffness: 300 }
        }
      >
        <Image src={profile_image} alt="プロフィール画像" className="image" />
      </motion.div>
      <div className="answer">
        <p>
          {shown}
          {!isDone && isAnswering && <span className="caret">▍</span>}
        </p>
        {!isDone && isAnswering && <p className="tapHint">タップで全文表示</p>}
      </div>
      <div className="footer">
        {isDone &&
          (isLast ? (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <DopamineButton onClick={onReplay}>もう一度見る</DopamineButton>
            </motion.div>
          ) : (
            <motion.p
              className="nextHint"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <TbChevronUp size={20} />
              上にスワイプ・スクロールで次の質問
            </motion.p>
          ))}
      </div>
    </motion.div>
  );
};

export type ContainerProps = {};
type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ className }: Props): JSX.Element => {
  const { isMuted } = useDopamineMode();
  const [index, setIndex] = useState<number>(0);
  // 1: 次の質問へ（下から上がってくる） / -1: 前の質問へ
  const [direction, setDirection] = useState<number>(1);
  // もう一度見る時、同じ1問目でも作り直して最初から再生させるため
  const [round, setRound] = useState<number>(0);
  // ホイールやキーの連続入力でも最新の位置から計算できるよう、state とは別に持つ
  const indexRef = useRef<number>(0);
  const lockedUntilRef = useRef<number>(0);
  const touchStartYRef = useRef<number | null>(null);
  const columnRef = useRef<HTMLDivElement>(null);

  const go = useCallback((delta: number) => {
    const now = Date.now();
    if (now < lockedUntilRef.current) return;
    const nextIndex = indexRef.current + delta;
    if (nextIndex < 0 || nextIndex >= faqData.length) return;
    lockedUntilRef.current = now + NAVIGATION_LOCK_MS;
    indexRef.current = nextIndex;
    setDirection(delta);
    setIndex(nextIndex);
  }, []);

  const replay = useCallback(() => {
    unlock();
    indexRef.current = 0;
    setDirection(1);
    setIndex(0);
    setRound((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") go(1);
      if (e.key === "ArrowUp") go(-1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [go]);

  // ページ自体がスクロールしないよう preventDefault するため、passive: false で登録する
  useEffect(() => {
    const column = columnRef.current;
    if (!column) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) < 10) return;
      go(e.deltaY > 0 ? 1 : -1);
    };
    column.addEventListener("wheel", handleWheel, { passive: false });
    return () => column.removeEventListener("wheel", handleWheel);
  }, [go]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const deltaY = touchStartYRef.current - e.changedTouches[0].clientY;
    touchStartYRef.current = null;
    if (Math.abs(deltaY) < SWIPE_THRESHOLD_PX) return;
    go(deltaY > 0 ? 1 : -1);
  };

  const item = faqData[index];

  return (
    <MotionConfig reducedMotion="user">
      <div className={className}>
        <Link href="/" className="close" aria-label="トップページに戻る">
          <TbX size={24} />
        </Link>
        <div
          className="column"
          ref={columnRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={`${round}-${index}`}
              className="slideFrame"
              custom={direction}
              variants={{
                enter: (dir: number) => ({ y: `${dir * 100}%` }),
                center: { y: 0 },
                exit: (dir: number) => ({ y: `${dir * -100}%` }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
            >
              <Slide
                question={item.question}
                answer={item.answer}
                isLast={index === faqData.length - 1}
                isMuted={isMuted}
                onReplay={replay}
              />
            </motion.div>
          </AnimatePresence>
          <div className="progress">
            {faqData.map((_, i) => (
              <span key={i} className={i === index ? "dot active" : "dot"} />
            ))}
          </div>
        </div>
        <div className="navButtons">
          <button
            type="button"
            aria-label="前の質問"
            disabled={index === 0}
            onClick={() => go(-1)}
          >
            <TbChevronUp size={24} />
          </button>
          <button
            type="button"
            aria-label="次の質問"
            disabled={index === faqData.length - 1}
            onClick={() => go(1)}
          >
            <TbChevronDown size={24} />
          </button>
        </div>
      </div>
    </MotionConfig>
  );
};

const rainbow = `red, orange, yellow, lime, cyan, blue, magenta, red`;

// ショート動画のように画面全体を使う。PC では中央に縦長の画面を置き、左右は暗くする
const StyledComponent = styled(Component)`
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  justify-content: center;
  background-color: #0f0f0f;
  color: #222;

  > .close {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 2;
    display: flex;
    padding: 6px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.4);
    color: #fff;
  }

  > .column {
    position: relative;
    width: 100%;
    max-width: 440px;
    height: calc(100svh - ${DOPAMINE_CONTROLS_SAFE_AREA}px);
    overflow: hidden;
    touch-action: none;
    background: linear-gradient(160deg, #ffe3f6, #fff8c4, #c9fff0, #d6ecff);
    @media (${device.tablet}) {
      margin-top: 12px;
      height: calc(100svh - ${DOPAMINE_CONTROLS_SAFE_AREA + 12}px);
      border-radius: 16px;
    }

    > .slideFrame {
      position: absolute;
      inset: 0;
    }

    > .progress {
      position: absolute;
      top: 50%;
      right: 8px;
      transform: translateY(-50%);
      display: flex;
      flex-direction: column;
      gap: 6px;
      > .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.2);
        transition: 0.3s;
        &.active {
          height: 18px;
          border-radius: 3px;
          background: #ff3d8b;
        }
      }
    }
  }

  > .navButtons {
    display: none;
    @media (${device.tablet}) {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 12px;
      margin-left: 16px;
    }
    > button {
      display: flex;
      padding: 10px;
      border: none;
      border-radius: 50%;
      background: #272727;
      color: #fff;
      cursor: pointer;
      &:disabled {
        opacity: 0.3;
        cursor: default;
      }
    }
  }

  .slide {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    height: 100%;
    padding: 56px 28px 16px 20px;
    cursor: pointer;

    /* YouTuber のテロップ風: 白文字に太い縁取り */
    > .banner {
      color: #fff;
      font-size: 34px;
      font-weight: 900;
      -webkit-text-stroke: 8px #ff3d8b;
      paint-order: stroke fill;
      text-shadow: 0 4px 0 #b3005a;
    }

    > .questionCard {
      width: 100%;
      padding: 12px 16px;
      border-radius: 12px;
      background: #fff;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
      > .commenter {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #777;
        font-size: 12px;
      }
      > .question {
        margin-top: 4px;
        font-size: 17px;
        font-weight: bold;
      }
    }

    > .avatar {
      flex-shrink: 0;
      width: 96px;
      height: 96px;
      padding: 3px;
      border-radius: 50%;
      background: conic-gradient(${rainbow});
      > .image {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }
    }

    > .answer {
      flex: 1;
      width: 100%;
      overflow-y: auto;
      font-size: 15px;
      line-height: 1.8;
      > .tapHint {
        margin-top: 4px;
        color: #888;
        font-size: 11px;
        text-align: center;
      }
      .caret {
        animation: faq-caret 0.8s steps(1) infinite;
      }
    }

    > .footer {
      display: flex;
      justify-content: center;
      min-height: 56px;
      > .nextHint {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #555;
        font-size: 13px;
      }
    }
  }

  @keyframes faq-caret {
    50% {
      opacity: 0;
    }
  }
`;

export const FaqShorts = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};
