import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import worksData, { WorksData } from "src/works";
import { device } from "src/constants/breakpoints";
import { useDopamineMode } from "src/contexts/DopamineMode";
import { playPop, playReveal, playTick, unlock } from "src/lib/dopamineSound";

type Phase = "sealed" | "charging" | "burst" | "reveal" | "collection";
type Drag = {
  id: number;
  startX: number;
  width: number;
  progress: number;
  tick: number;
};

const WorkLink = ({ work }: { work: WorksData }): JSX.Element | null =>
  work.detail ? (
    <Link className="workLink" href={`/works/${work.slug}`}>
      詳細を見る ↗
    </Link>
  ) : work.href ? (
    <a className="workLink" target="_blank" rel="noreferrer" href={work.href}>
      サイトを見る ↗
    </a>
  ) : null;

export type ContainerProps = {};
type Props = ContainerProps & { className?: string };

const Component = ({ className }: Props): JSX.Element => {
  const { isMuted } = useDopamineMode();
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("sealed");
  const phaseRef = useRef<Phase>("sealed");
  const [progress, setProgress] = useState(0);
  const [index, setIndex] = useState(0);
  const drag = useRef<Drag | null>(null);
  const openButton = useRef<HTMLButtonElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const skipButton = useRef<HTMLButtonElement>(null);
  const collectionTitle = useRef<HTMLHeadingElement>(null);
  const previousPhase = useRef<Phase>("sealed");
  const moveTo = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const open = () => {
    if (phaseRef.current !== "sealed") return;
    drag.current = null;
    setProgress(1);
    unlock();
    if (!isMuted) playPop();
    moveTo(reduceMotion ? "reveal" : "charging");
  };
  const reset = () => {
    drag.current = null;
    setProgress(0);
    setIndex(0);
    moveTo("sealed");
  };

  // One timer per phase. Skipping, resetting, disabling the mode or navigating
  // away cancels it; repeated pointer/click events cannot start a second sequence.
  useEffect(() => {
    if (phase !== "charging" && phase !== "burst") return;
    const timer = window.setTimeout(
      () => {
        const next = phase === "charging" ? "burst" : "reveal";
        phaseRef.current = next;
        setPhase(next);
      },
      reduceMotion ? 0 : phase === "charging" ? 360 : 900,
    );
    return () => window.clearTimeout(timer);
  }, [phase, reduceMotion]);

  useEffect(() => {
    if (phase === "reveal" && !isMuted) playReveal();
  }, [phase, index, isMuted]);

  useEffect(() => {
    if (phase === previousPhase.current) return;
    previousPhase.current = phase;
    if (phase === "charging")
      skipButton.current?.focus({ preventScroll: true });
    if (phase === "reveal") nextButton.current?.focus({ preventScroll: true });
    if (phase === "collection")
      collectionTitle.current?.focus({ preventScroll: true });
    if (phase === "sealed") openButton.current?.focus({ preventScroll: true });
  }, [phase]);

  const startTear = (event: React.PointerEvent<HTMLDivElement>) => {
    if (
      phaseRef.current !== "sealed" ||
      drag.current ||
      !event.isPrimary ||
      event.button !== 0
    )
      return;
    const bounds = event.currentTarget.getBoundingClientRect();
    drag.current = {
      id: event.pointerId,
      startX: event.clientX,
      width: bounds.width,
      progress: 0,
      tick: 0,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    unlock();
  };
  const tear = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (
      !current ||
      current.id !== event.pointerId ||
      phaseRef.current !== "sealed"
    )
      return;
    // Either direction works. Use distance from the initial contact rather than
    // accumulated movement so wiggling in place cannot accidentally open a pack.
    const value = Math.min(
      1,
      Math.abs(event.clientX - current.startX) /
        Math.min(118, current.width * 0.42),
    );
    current.progress = value;
    setProgress(value);
    const tick = Math.floor(value * 6);
    if (tick > current.tick && !isMuted) playTick();
    current.tick = tick;
    if (value >= 1) open();
  };
  const cancelTear = (event: React.PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    if (phaseRef.current === "sealed") setProgress(0);
  };
  const work = worksData[index];
  const opened = phase === "burst";

  return (
    <section
      className={className}
      aria-label="作品カードパック"
      data-phase={phase}
      onKeyDown={(event) => {
        if (event.key === "Escape" && phase !== "sealed") {
          event.preventDefault();
          reset();
        }
      }}
    >
      <div className="packHeader">
        <p className="eyebrow">KOICHI’S WORKS / COLLECTION 01</p>
        <h3>
          {phase === "collection"
            ? "すべての作品を、手の中に。"
            : "つくってきたものを、開けよう。"}
        </h3>
        <p className="intro">
          {worksData.length}
          枚の作品カード入り。すべてSSRのポートフォリオパック。
        </p>
      </div>
      <p className="srOnly" role="status" aria-live="polite">
        {phase === "sealed"
          ? "パックの上の切り口を左右になぞるか、パックを開けるボタンを押してください。"
          : phase === "reveal"
            ? `SSR ${index + 1}枚目、全${worksData.length}枚。${work.title}`
            : phase === "collection"
              ? "すべての作品を表示しました。"
              : "パックを開封しています。"}
      </p>
      {phase !== "collection" ? (
        <div className={`stage ${phase}`}>
          <div className="stageGrid" aria-hidden="true" />
          <div className="ambient" aria-hidden="true" />
          <div className="stageTop">
            <span>PORTFOLIO BOOSTER</span>
            <span>✦ ALL SSR</span>
          </div>
          {phase !== "sealed" && (
            <button
              ref={skipButton}
              className="skip"
              onClick={() => {
                drag.current = null;
                moveTo("collection");
              }}
            >
              すべて見る ↗
            </button>
          )}
          {(phase === "sealed" ||
            phase === "charging" ||
            phase === "burst") && (
            <div className="packScene">
              {opened && <div className="burstRing" aria-hidden="true" />}
              {opened && (
                <div className="flyingCards" aria-hidden="true">
                  {worksData.slice(0, 7).map((item, i) => (
                    <div
                      key={item.slug}
                      className="flyingCard"
                      style={
                        {
                          "--fan-x": `${(i - Math.min(worksData.length - 1, 6) / 2) * 47}px`,
                          "--fan-y": `${-95 + Math.pow(i - Math.min(worksData.length - 1, 6) / 2, 2) * 13}px`,
                          "--fan-angle": `${(i - Math.min(worksData.length - 1, 6) / 2) * 13}deg`,
                        } as React.CSSProperties
                      }
                    >
                      <span>✦</span>
                      <small>
                        KOICHI
                        <br />
                        WORKS
                      </small>
                    </div>
                  ))}
                </div>
              )}
              <div
                className="pack"
                style={
                  {
                    "--tear": `${progress * 100}%`,
                    "--tilt": `${progress * -3}deg`,
                  } as React.CSSProperties
                }
              >
                <div className="packLid" aria-hidden="true">
                  <span>TEAR HERE ————————— ✂</span>
                </div>
                <div className="packBody" aria-hidden="true">
                  <div className="foil" />
                  <div className="packEdition">
                    KOICHI’S PORTFOLIO <span>01</span>
                  </div>
                  <div className="packStar">✦</div>
                  <div className="packTitle">
                    BUILD.
                    <br />
                    SHIP.
                    <br />
                    <em>SHINE.</em>
                  </div>
                  <div className="packCaption">アイデアを、カタチに。</div>
                  <div className="packFooter">
                    <b>SSR</b>
                    <span>
                      WORKS COLLECTION
                      <br />
                      {worksData.length} CARDS / ALL SPECIAL
                    </span>
                  </div>
                </div>
                <div
                  className="tearZone"
                  aria-hidden="true"
                  onPointerDown={startTear}
                  onPointerMove={tear}
                  onPointerUp={cancelTear}
                  onPointerCancel={cancelTear}
                  onLostPointerCapture={cancelTear}
                >
                  <div className="tearTrack">
                    <i />
                  </div>
                  <span>
                    {progress > 0
                      ? "そのまま、もう少し →"
                      : "← ここをなぞって開封 →"}
                  </span>
                </div>
              </div>
              <div className="packShadow" aria-hidden="true" />
            </div>
          )}
          {phase === "reveal" && (
            <div className="revealScene">
              <div className="revealHalo" aria-hidden="true" />
              <p className="revealLabel">SPECIAL SUPER RARE</p>
              <AnimatePresence mode="wait">
                <motion.article
                  key={work.slug}
                  className="heroCard"
                  initial={
                    reduceMotion
                      ? { opacity: 0 }
                      : {
                          opacity: 0,
                          y: 45,
                          scale: 0.8,
                          rotateY: -70,
                          rotate: -5,
                        }
                  }
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    rotateY: 0,
                    rotate: 0,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: reduceMotion ? 0.1 : 0.48,
                    ease: "backOut",
                  }}
                >
                  <div className="cardMeta">
                    <b>SSR ✦</b>
                    <span>No. {String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <Image
                    src={work.src}
                    width={500}
                    height={300}
                    alt=""
                    priority
                  />
                  <h4>{work.title}</h4>
                  <p>{work.description}</p>
                  <WorkLink work={work} />
                  <div className="cardShine" aria-hidden="true" />
                </motion.article>
              </AnimatePresence>
              <div className="revealActions">
                <span>
                  {String(index + 1).padStart(2, "0")} /{" "}
                  {String(worksData.length).padStart(2, "0")}
                </span>
                <button
                  ref={nextButton}
                  className="primary"
                  onClick={() => {
                    if (index < worksData.length - 1)
                      setIndex((current) =>
                        Math.min(current + 1, worksData.length - 1),
                      );
                    else moveTo("collection");
                  }}
                >
                  {index < worksData.length - 1
                    ? "次のカード →"
                    : "コレクションを見る →"}
                </button>
              </div>
            </div>
          )}
          {phase === "sealed" && (
            <div className="openActions">
              <p>切り口を指でスワイプ / マウスでドラッグ</p>
              <button ref={openButton} className="openFallback" onClick={open}>
                ボタンでパックを開ける ↗
              </button>
            </div>
          )}
          {(phase === "charging" || phase === "burst") && (
            <p className="openingLabel">
              {phase === "charging"
                ? "この中に、つくってきたすべて。"
                : "✦ COLLECTION UNLOCKED ✦"}
            </p>
          )}
          {phase !== "sealed" && (
            <button className="reset" onClick={reset}>
              開封前に戻る
            </button>
          )}
        </div>
      ) : (
        <div className="collection">
          <h4 ref={collectionTitle} tabIndex={-1}>
            COLLECTION COMPLETE{" "}
            <span>
              {worksData.length} / {worksData.length}
            </span>
          </h4>
          <div className="grid">
            {worksData.map((item, i) => (
              <article className="resultCard" key={item.slug}>
                <div className="cardMeta">
                  <b>SSR ✦</b>
                  <span>No. {String(i + 1).padStart(2, "0")}</span>
                </div>
                <Image src={item.src} width={500} height={300} alt="" />
                <h4>{item.title}</h4>
                <p>{item.description}</p>
                <WorkLink work={item} />
              </article>
            ))}
          </div>
          <button className="primary" onClick={reset}>
            もう一度パックを開ける ↻
          </button>
        </div>
      )}
    </section>
  );
};

const StyledComponent = styled(Component)`
  width: 100%;
  color: #252139;
  padding-bottom: 88px;
  button {
    font: inherit;
    cursor: pointer;
  }
  button:focus-visible,
  a:focus-visible,
  h4:focus-visible {
    outline: 3px solid #fc69dc;
    outline-offset: 5px;
  }
  .srOnly {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .packHeader {
    text-align: center;
    margin: 30px 0 24px;
  }
  .eyebrow {
    font-size: 10px;
    letter-spacing: 0.18em;
    font-weight: 800;
  }
  .packHeader h3 {
    margin: 10px 0;
    font-size: clamp(19px, 3vw, 28px);
  }
  .intro {
    font-size: 12px;
    line-height: 1.8;
  }
  .stage {
    position: relative;
    isolation: isolate;
    min-height: 640px;
    overflow: hidden;
    border-radius: 24px;
    color: #f5f2ff;
    background: #100d21;
    border: 1px solid #47345c;
    box-shadow: 0 25px 70px #26114335;
  }
  .stageGrid {
    position: absolute;
    inset: 0;
    z-index: -1;
    opacity: 0.14;
    background-image:
      linear-gradient(#9990c1 1px, transparent 1px),
      linear-gradient(90deg, #9990c1 1px, transparent 1px);
    background-size: 44px 44px;
    mask-image: linear-gradient(transparent, #000);
  }
  .ambient {
    position: absolute;
    inset: 0;
    z-index: -1;
    background: radial-gradient(ellipse at 50% 45%, #69438c66, transparent 65%);
  }
  .stageTop {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 24px;
    font-size: 9px;
    letter-spacing: 0.14em;
    color: #c2b4d7;
  }
  .stageTop span:last-child {
    color: #f5d69b;
  }
  .packScene {
    position: relative;
    width: 248px;
    height: 365px;
    margin: 55px auto 0;
    perspective: 1000px;
  }
  .pack {
    position: relative;
    width: 100%;
    height: 100%;
    transform: rotate(-5deg) rotateY(var(--tilt));
    filter: drop-shadow(0 16px 22px #0008);
  }
  .packBody,
  .packLid {
    position: absolute;
    width: 100%;
    overflow: hidden;
    background: linear-gradient(
      118deg,
      #cab5ea,
      #edc9f1 19%,
      #795ca6 40%,
      #e6f2ed 58%,
      #a7b6e5 73%,
      #eebcde
    );
    border: 1px solid #e9dbff;
  }
  .packLid {
    top: 0;
    height: 44px;
    clip-path: polygon(
      0 0,
      100% 0,
      100% 85%,
      94% 100%,
      88% 86%,
      82% 100%,
      76% 86%,
      70% 100%,
      64% 86%,
      58% 100%,
      52% 86%,
      46% 100%,
      40% 86%,
      34% 100%,
      28% 86%,
      22% 100%,
      16% 86%,
      10% 100%,
      4% 86%,
      0 100%
    );
  }
  .packLid::before {
    content: "";
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      #382e5038 0 1px,
      transparent 1px 4px
    );
  }
  .packLid span {
    position: absolute;
    top: 12px;
    left: 22px;
    color: #382c51;
    font-size: 9px;
    letter-spacing: 2px;
  }
  .packBody {
    top: 36px;
    bottom: 0;
    padding: 20px;
    border-radius: 0 0 4px 4px;
  }
  .packBody::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 14px;
    background: repeating-linear-gradient(
      0deg,
      #49316150 0 1px,
      transparent 1px 4px
    );
  }
  .foil {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      115deg,
      transparent 20%,
      #fff9 40%,
      transparent 60%
    );
    background-size: 250% 100%;
    animation: foil 4s ease-in-out infinite;
    mix-blend-mode: soft-light;
  }
  .packEdition {
    position: relative;
    display: flex;
    justify-content: space-between;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.1em;
    color: #302c49;
  }
  .packStar {
    position: absolute;
    right: 5px;
    top: 26px;
    font-size: 166px;
    line-height: 1;
    color: #ffffff55;
    text-shadow: 1px 1px #fff8;
    transform: rotate(12deg);
  }
  .packTitle {
    position: relative;
    margin-top: 29px;
    font-size: 47px;
    font-weight: 900;
    letter-spacing: -0.06em;
    line-height: 0.97;
    color: #28203e;
    text-shadow: 0 1px #ffffff88;
  }
  .packTitle em {
    color: #ffffed;
    text-shadow: 0 2px 14px #63367b;
  }
  .packCaption {
    position: relative;
    margin-top: 15px;
    font-size: 10px;
    color: #33233d;
    font-weight: 700;
  }
  .packFooter {
    position: absolute;
    left: 20px;
    right: 20px;
    bottom: 26px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #332540;
    border-top: 1px solid #3d294c66;
    padding-top: 12px;
  }
  .packFooter b {
    font-size: 26px;
    font-style: italic;
  }
  .packFooter span {
    font-size: 7px;
    line-height: 1.6;
    letter-spacing: 0.08em;
  }
  .tearZone {
    position: absolute;
    top: 3px;
    left: -16px;
    right: -16px;
    height: 64px;
    touch-action: none;
    user-select: none;
    cursor: ew-resize;
    z-index: 2;
  }
  .tearZone span {
    display: block;
    margin-top: -66px;
    text-align: center;
    font-size: 12px;
    color: #eee6ff;
    letter-spacing: 0.06em;
  }
  .tearTrack {
    position: absolute;
    top: 33px;
    left: 0;
    right: 0;
    height: 3px;
    border-top: 2px dashed #fff9;
  }
  .tearTrack i {
    position: absolute;
    top: -2px;
    left: 0;
    width: var(--tear);
    height: 3px;
    background: #fff3a7;
    box-shadow: 0 0 14px 3px #fae1ab;
  }
  .packShadow {
    position: absolute;
    bottom: -26px;
    left: 15%;
    right: 15%;
    height: 18px;
    background: #020108;
    border-radius: 50%;
    filter: blur(12px);
  }
  .openActions {
    position: relative;
    margin: 47px 12px 26px;
    text-align: center;
  }
  .openActions p {
    font-size: 11px;
    color: #c4bbd7;
    margin-bottom: 12px;
  }
  .openFallback {
    border: 1px solid #a092b3;
    border-radius: 99px;
    background: #ffffff0a;
    color: #f2ebfa;
    padding: 10px 20px;
    font-size: 12px;
  }
  .charging .pack {
    animation: anticipate 0.36s ease-in forwards;
  }
  .charging .tearZone,
  .burst .tearZone {
    display: none;
  }
  .burst .packLid {
    animation: lidAway 0.65s ease-out forwards;
  }
  .burst .packBody {
    animation: bodyAway 0.8s ease-in forwards;
  }
  .burst .packShadow {
    opacity: 0;
  }
  .burstRing {
    position: absolute;
    inset: 0;
    border: 2px solid #f4d8a4;
    border-radius: 50%;
    box-shadow: 0 0 60px #e39cfe;
    animation: ring 0.9s ease-out forwards;
  }
  .flyingCards {
    position: absolute;
    inset: 0;
  }
  .flyingCard {
    position: absolute;
    inset: 36px 32px;
    border: 2px solid #e0c384;
    border-radius: 12px;
    background: repeating-linear-gradient(
      45deg,
      #36204e 0 8px,
      #412959 8px 9px
    );
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 20px #f1c88955;
    animation: cardBurst 0.9s cubic-bezier(0.16, 0.8, 0.3, 1) both;
  }
  .flyingCard span {
    color: #f1d49a;
    font-size: 80px;
  }
  .flyingCard small {
    text-align: center;
    font-size: 14px;
    letter-spacing: 0.25em;
    color: #e4cba0;
  }
  .openingLabel {
    position: relative;
    text-align: center;
    margin-top: 50px;
    font-size: 12px;
    letter-spacing: 0.1em;
    color: #f9dfa9;
  }
  .skip {
    position: absolute;
    top: 52px;
    right: 20px;
    z-index: 3;
    background: transparent;
    color: #d4c8e3;
    border: 0;
    padding: 10px;
    font-size: 11px;
  }
  .reset {
    display: block;
    position: relative;
    margin: 18px auto 22px;
    padding: 8px 16px;
    color: #c8bcd9;
    background: transparent;
    border: 0;
    font-size: 11px;
    text-decoration: underline;
  }
  .revealScene {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 35px 20px 0;
    perspective: 1000px;
  }
  .revealHalo {
    position: absolute;
    top: 80px;
    width: 330px;
    height: 330px;
    border-radius: 50%;
    background: conic-gradient(
      #edd08855,
      #f477d855,
      #65dbd755,
      #be9bfd55,
      #edd08855
    );
    filter: blur(38px);
    animation: halo 12s linear infinite;
  }
  .revealLabel {
    position: relative;
    color: #f7d99b;
    font-size: 11px;
    letter-spacing: 0.2em;
    margin-bottom: 18px;
  }
  .heroCard,
  .resultCard {
    position: relative;
    width: 100%;
    border: 2px solid #eac88b;
    border-radius: 14px;
    padding: 15px;
    color: #f6f0ff;
    background: linear-gradient(145deg, #30233f, #171425);
    box-shadow:
      0 0 0 4px #e1bb7d22,
      0 12px 45px #0005;
    overflow: hidden;
  }
  .heroCard {
    max-width: 340px;
  }
  .cardMeta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    color: #f2d59b;
  }
  .cardMeta b {
    font-size: 24px;
    font-style: italic;
  }
  .cardMeta span {
    font-size: 9px;
    letter-spacing: 0.12em;
  }
  .heroCard img,
  .resultCard img {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 5 / 3;
    object-fit: cover;
    border-radius: 7px;
  }
  .heroCard h4,
  .resultCard h4 {
    font-size: 16px;
    line-height: 1.6;
    margin: 15px 0 8px;
  }
  .heroCard p,
  .resultCard p {
    font-size: 11px;
    line-height: 1.8;
    color: #c6bdd3;
  }
  .workLink {
    display: inline-block;
    position: relative;
    z-index: 1;
    margin-top: 16px;
    font-size: 12px;
    color: #f3dcae;
  }
  .cardShine {
    position: absolute;
    pointer-events: none;
    inset: 0;
    background: linear-gradient(
      115deg,
      transparent 35%,
      #fff5 48%,
      transparent 62%
    );
    transform: translateX(-120%);
    animation: cardShine 1s 0.3s ease-out;
  }
  .revealActions {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    width: 100%;
    max-width: 340px;
    margin-top: 24px;
  }
  .revealActions > span {
    font-size: 11px;
    color: #b5a8c6;
    letter-spacing: 0.1em;
    white-space: nowrap;
  }
  .primary {
    background: linear-gradient(115deg, #f3d595, #edd5fa);
    border: 0;
    border-radius: 99px;
    padding: 13px 21px;
    color: #30213b;
    font-size: 12px;
    font-weight: 800;
  }
  .collection {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 26px;
  }
  .collection > h4 {
    font-size: 12px;
    letter-spacing: 0.08em;
  }
  .collection > h4 span {
    margin-left: 12px;
    color: #7c5389;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    width: 100%;
  }
  .resultCard {
    display: flex;
    flex-direction: column;
  }
  .resultCard .workLink {
    align-self: flex-start;
  }
  @media (${device.tablet}) {
    .grid {
      grid-template-columns: 1fr 1fr;
    }
  }
  @media (max-width: 380px) {
    .stageTop {
      padding: 20px 14px;
      font-size: 8px;
    }
    .packScene {
      width: 222px;
    }
    .packTitle {
      font-size: 43px;
    }
    .primary {
      padding: 12px 15px;
    }
  }
  @keyframes foil {
    0%,
    100% {
      background-position: 100% 0;
    }
    50% {
      background-position: 0 0;
    }
  }
  @keyframes anticipate {
    0% {
      transform: rotate(-5deg) scale(1);
    }
    65% {
      transform: rotate(-3deg) scale(0.96);
      filter: drop-shadow(0 0 14px #f0c882);
    }
    100% {
      transform: rotate(-5deg) scale(1.03);
      filter: drop-shadow(0 0 38px #fff3b7);
    }
  }
  @keyframes lidAway {
    to {
      transform: translate(125px, -190px) rotate(42deg);
      opacity: 0;
    }
  }
  @keyframes bodyAway {
    to {
      transform: translate(-25px, 200px) rotate(-16deg);
      opacity: 0;
    }
  }
  @keyframes ring {
    from {
      transform: scale(0.4);
      opacity: 0.9;
    }
    to {
      transform: scale(3.3);
      opacity: 0;
    }
  }
  @keyframes cardBurst {
    0% {
      transform: translateY(35px) scale(0.7);
      opacity: 0;
    }
    35% {
      opacity: 1;
    }
    75% {
      opacity: 1;
    }
    100% {
      transform: translate(var(--fan-x), var(--fan-y)) rotate(var(--fan-angle))
        scale(0.86);
      opacity: 0;
    }
  }
  @keyframes halo {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes cardShine {
    to {
      transform: translateX(120%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation: none !important;
      transition: none !important;
    }
    .revealHalo {
      opacity: 0.5;
    }
  }
`;

// Keep the existing export so normal works pages and the dopamine toggle retain
// their current routing. Rarity is presentation only; every pack contains all works.
export const WorksGacha = (props: ContainerProps): JSX.Element => (
  <StyledComponent {...props} />
);
