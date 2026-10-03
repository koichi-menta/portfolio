import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import worksData, { WorksData } from "src/works";
import { device } from "src/constants/breakpoints";
import { DopamineButton } from "src/components/parts/DopamineButton";
import {
  DOPAMINE_CONTROLS_SAFE_AREA,
  useDopamineMode,
} from "src/contexts/DopamineMode";
import { useTimedSequence } from "src/hooks/useTimedSequence";
import { playCharge, playReveal, unlock } from "src/lib/dopamineSound";

// 全作品SSR確定なので、どの確定演出が出るかで期待感を作る
// gold: 金の確定演出 / rainbow: 虹の確定演出 / promotion: 金から虹へ昇格する演出
type Effect = "gold" | "rainbow" | "promotion";
const EFFECTS: Effect[] = ["gold", "rainbow", "promotion"];

const CHARGE_MS = 1800;
const REVEAL_MS = 1000;
// 1枚目は溜めの玉が退場するのを待ってから出るので、その分だけ長く見せる
const ORB_EXIT_MS = 250;

const shuffle = <T,>(items: T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

type OrbProps = {
  effect: Effect;
};

// 溜め演出: 光の玉が震えながら膨らみ、確定演出の色に染まる。
// 文字は玉と一緒に拡大しないよう、玉の外に並べる
const Orb = ({ effect }: OrbProps): JSX.Element => (
  <motion.div
    className="charge"
    // 次のカードは退場を待ってから出るので、退場は素早く
    exit={{
      scale: 3,
      opacity: 0,
      transition: { duration: ORB_EXIT_MS / 1000 },
    }}
  >
    <div className="chargeLabelSlot">
      {effect === "promotion" && (
        <motion.p
          className="chargeLabel promoted"
          initial={{ scale: 2.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: (CHARGE_MS / 1000) * 0.6,
            type: "spring",
            stiffness: 500,
          }}
        >
          昇格!!
        </motion.p>
      )}
    </div>
    <motion.div
      className="orb"
      initial={{ scale: 0.3, opacity: 0 }}
      animate={{
        scale: [0.3, 1, 0.9, 1.15, 1.3],
        opacity: 1,
        x: [0, -6, 6, -8, 8, -10, 10, 0],
      }}
      transition={{
        duration: CHARGE_MS / 1000,
        ease: "easeIn",
        opacity: { duration: 0.2 },
      }}
    >
      <div className="orbCore gold" />
      {effect !== "gold" && (
        <motion.div
          className="orbCore rainbow"
          initial={{ opacity: effect === "rainbow" ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={
            effect === "promotion"
              ? { delay: (CHARGE_MS / 1000) * 0.6, duration: 0.15 }
              : { duration: 0 }
          }
        />
      )}
    </motion.div>
    <div className="chargeLabelSlot">
      <motion.p
        className="chargeLabel"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
      >
        {effect === "rainbow" ? "超SSR確定" : "SSR確定"}
      </motion.p>
    </div>
  </motion.div>
);

type RevealCardProps = {
  work: WorksData;
  index: number;
  total: number;
};

// 1枚ずつ、裏返ったカードがひっくり返りながら飛び出してくる
const RevealCard = ({ work, index, total }: RevealCardProps): JSX.Element => (
  <motion.div
    className="revealCard"
    initial={{ scale: 0.2, rotateY: 180, opacity: 0 }}
    animate={{ scale: 1, rotateY: 0, opacity: 1 }}
    exit={{ scale: 1.15, opacity: 0, transition: { duration: 0.15 } }}
    transition={{ duration: 0.35, ease: "backOut" }}
  >
    <div className="halo" />
    <div className="cardBody">
      <motion.span
        className="rarity"
        initial={{ scale: 3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
      >
        SSR
      </motion.span>
      <Image src={work.src} width={500} height={300} alt="" />
      <p className="cardTitle">{work.title}</p>
    </div>
    <p className="count">
      {index} / {total}
    </p>
  </motion.div>
);

type ResultCardProps = {
  work: WorksData;
  index: number;
};

const ResultCard = ({ work, index }: ResultCardProps): JSX.Element => (
  <motion.div
    className="resultCard"
    initial={{ y: 24, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: index * 0.08 }}
  >
    <span className="rarity">SSR</span>
    <Image src={work.src} width={500} height={300} alt="" />
    <p className="cardTitle">{work.title}</p>
    <p className="description">{work.description}</p>
    {work.detail && (
      <Link className="link" href={`/works/${work.slug}`}>
        詳細を見る
      </Link>
    )}
    {!work.detail && work.href && (
      <a className="link" target="_blank" rel="noreferrer" href={work.href}>
        サイトを見る
      </a>
    )}
  </motion.div>
);

export type ContainerProps = {};
type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ className }: Props): JSX.Element => {
  const { isMuted } = useDopamineMode();
  const [pulled, setPulled] = useState<WorksData[]>([]);
  const [effect, setEffect] = useState<Effect>("rainbow");
  const durations = useMemo(
    () => [
      CHARGE_MS,
      ...pulled.map((_, i) => (i === 0 ? REVEAL_MS + ORB_EXIT_MS : REVEAL_MS)),
    ],
    [pulled],
  );
  const { step, isIdle, isPlaying, isDone, start, next, skip } =
    useTimedSequence(durations);

  const handlePull = useCallback(() => {
    unlock();
    setPulled(shuffle(worksData));
    setEffect(EFFECTS[Math.floor(Math.random() * EFFECTS.length)]);
    start();
  }, [start]);

  useEffect(() => {
    if (isMuted || !isPlaying) return;
    if (step === 0) playCharge(CHARGE_MS / 1000);
    else playReveal();
  }, [step, isPlaying, isMuted]);

  return (
    <MotionConfig reducedMotion="user">
      <div className={className}>
        {!isDone && (
          <div className="ready">
            <p className="banner">全作品SSR確定ガチャ</p>
            <p className="sub">{worksData.length}連で全作品をお迎えしよう</p>
            <DopamineButton onClick={handlePull}>
              {worksData.length}連ガチャを引く
            </DopamineButton>
          </div>
        )}

        {isDone && (
          <div className="result">
            <h3 className="resultTitle">ガチャ結果</h3>
            <div className="grid">
              {pulled.map((work, i) => (
                <ResultCard key={work.slug} work={work} index={i} />
              ))}
            </div>
            <DopamineButton onClick={handlePull}>もう一度引く</DopamineButton>
          </div>
        )}

        <AnimatePresence>
          {isPlaying && (
            <motion.div
              className={clsx("stage", effect)}
              onClick={next}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="rays" />
              <button
                type="button"
                className="skip"
                onClick={(e) => {
                  e.stopPropagation();
                  skip();
                }}
              >
                スキップ ≫
              </button>
              <AnimatePresence mode="wait">
                {step === 0 ? (
                  <Orb key="orb" effect={effect} />
                ) : (
                  <RevealCard
                    key={step}
                    work={pulled[step - 1]}
                    index={step}
                    total={pulled.length}
                  />
                )}
              </AnimatePresence>
              <p className="hint">タップで次へ</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
};

const rainbow = `red, orange, yellow, lime, cyan, blue, magenta, red`;

const StyledComponent = styled(Component)`
  width: 100%;
  color: #333;

  > .ready {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    margin-top: 48px;
    > .banner {
      font-size: 28px;
      font-weight: bold;
      background: linear-gradient(90deg, ${rainbow});
      background-size: 200% 100%;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      animation: gacha-text-flow 3s linear infinite;
    }
    > .sub {
      font-size: 14px;
    }
  }

  > .result {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    margin-top: 24px;
    > .resultTitle {
      font-size: 22px;
    }
    > .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      width: 100%;
      @media (${device.tablet}) {
        grid-template-columns: 1fr 1fr;
      }
    }
  }

  .resultCard {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    border: 3px solid transparent;
    border-radius: 16px;
    background:
      linear-gradient(#fffff8, #fffff8) padding-box,
      linear-gradient(135deg, ${rainbow}) border-box;
    img {
      width: 100%;
      height: auto;
      border-radius: 8px;
    }
    > .rarity {
      position: absolute;
      top: 8px;
      left: 8px;
      z-index: 1;
    }
    > .description {
      font-size: 13px;
    }
    > .link {
      align-self: flex-end;
      color: #333;
      font-size: 14px;
    }
  }

  .rarity {
    font-size: 22px;
    font-weight: 900;
    font-style: italic;
    background: linear-gradient(90deg, ${rainbow});
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    -webkit-text-stroke: 1px #fff;
    filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.5));
  }

  .cardTitle {
    font-weight: bold;
  }

  > .stage {
    position: fixed;
    inset: 0;
    z-index: 90;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: radial-gradient(circle, #2a1650 0%, #0b0820 70%);
    cursor: pointer;
    perspective: 1000px;

    /* 中心から回転する光の筋 */
    > .rays {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 200vmax;
      height: 200vmax;
      margin: -100vmax 0 0 -100vmax;
      background: repeating-conic-gradient(
        rgba(255, 255, 255, 0.16) 0deg 8deg,
        transparent 8deg 20deg
      );
      mask-image: radial-gradient(circle, #000 10%, transparent 50%);
      animation: gacha-rays 8s linear infinite;
    }
    &.gold > .rays {
      background-color: rgba(255, 200, 60, 0.12);
    }
    &.rainbow > .rays,
    &.promotion > .rays {
      background-color: rgba(255, 106, 213, 0.1);
    }

    > .skip {
      position: absolute;
      top: 16px;
      right: 16px;
      z-index: 1;
      padding: 6px 16px;
      border: 1px solid rgba(255, 255, 255, 0.6);
      border-radius: 999px;
      background: rgba(0, 0, 0, 0.3);
      color: #fff;
      font-size: 13px;
      cursor: pointer;
    }

    > .hint {
      position: absolute;
      bottom: ${DOPAMINE_CONTROLS_SAFE_AREA + 8}px;
      color: rgba(255, 255, 255, 0.7);
      font-size: 12px;
    }
  }

  .charge {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
    > .chargeLabelSlot {
      height: 40px;
    }
  }

  .chargeLabel {
    white-space: nowrap;
    color: #fff;
    font-size: 24px;
    font-weight: 900;
    text-shadow: 0 0 12px rgba(255, 220, 120, 0.9);
    &.promoted {
      font-size: 32px;
      text-shadow: 0 0 12px rgba(255, 106, 213, 0.9);
    }
  }

  .orb {
    position: relative;
    width: 160px;
    height: 160px;
    > .orbCore {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      &.gold {
        background: radial-gradient(circle, #fff 0%, #ffd34d 40%, #ff9a00 100%);
        box-shadow: 0 0 60px 20px rgba(255, 200, 60, 0.7);
      }
      &.rainbow {
        background:
          radial-gradient(circle, #fff 0%, transparent 60%),
          conic-gradient(${rainbow});
        box-shadow: 0 0 60px 20px rgba(255, 106, 213, 0.7);
        animation: gacha-spin 1s linear infinite;
      }
    }
  }

  .revealCard {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: min(80vw, 360px);
    > .halo {
      position: absolute;
      inset: -40px;
      border-radius: 50%;
      background: conic-gradient(${rainbow});
      filter: blur(40px);
      opacity: 0.6;
      animation: gacha-spin 3s linear infinite;
    }
    > .cardBody {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      padding: 16px;
      border: 3px solid transparent;
      border-radius: 16px;
      background:
        linear-gradient(#fffff8, #fffff8) padding-box,
        linear-gradient(135deg, ${rainbow}) border-box;
      img {
        width: 100%;
        height: auto;
        border-radius: 8px;
      }
      > .rarity {
        font-size: 32px;
      }
    }
    > .count {
      position: relative;
      margin-top: 12px;
      color: #fff;
      font-size: 14px;
    }
  }

  @keyframes gacha-rays {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes gacha-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes gacha-text-flow {
    0% {
      background-position: 0% 50%;
    }
    100% {
      background-position: 200% 50%;
    }
  }
`;

export const WorksGacha = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};
