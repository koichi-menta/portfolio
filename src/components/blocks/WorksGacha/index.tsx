import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { TbHandFinger } from "react-icons/tb";
import worksData, { WorksData } from "src/works";
import { device } from "src/constants/breakpoints";
import { DOPAMINE_CONTROLS_SAFE_AREA, useDopamineMode } from "src/contexts/DopamineMode";
import { playPop, playReveal, playTick, unlock } from "src/lib/dopamineSound";

type Phase = "intro" | "sealed" | "charging" | "burst" | "reveal" | "collection";
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
  const { isMuted, disable } = useDopamineMode();
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("intro");
  const phaseRef = useRef<Phase>("intro");
  const dialog = useRef<HTMLDialogElement>(null);
  const normalButton = useRef<HTMLButtonElement>(null);
  const sceneContent = useRef<HTMLDivElement>(null);
  const revealTitle = useRef<HTMLHeadingElement>(null);
  const [progress, setProgress] = useState(0);
  const [index, setIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [manualPause, setManualPause] = useState(false);
  const [linkHovered, setLinkHovered] = useState(false);
  const [linkFocused, setLinkFocused] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  const autoTimer = useRef<number>();
  const paused = manualPause || linkHovered || linkFocused || pageHidden;
  const stopAuto = () => window.clearTimeout(autoTimer.current);
  const drag = useRef<Drag | null>(null);
  const packElement = useRef<HTMLDivElement>(null);
  const collectionTitle = useRef<HTMLHeadingElement>(null);
  const previousPhase = useRef<Phase>("intro");
  const moveTo = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const open = () => {
    if (phaseRef.current !== "sealed") return;
    drag.current = null;
    setIsDragging(false);
    setProgress(1);
    unlock();
    if (!isMuted) playPop();
    moveTo(reduceMotion ? "reveal" : "charging");
  };
  const reset = () => {
    drag.current = null;
    stopAuto();
    setIsDragging(false);
    setManualPause(false);
    setLinkHovered(false);
    setLinkFocused(false);
    setProgress(0);
    setIndex(0);
    moveTo("intro");
  };
  // A native modal keeps background links inert and traps focus. Restore the
  // exact scroll position/styles even when routing away or disabling the mode.
  useEffect(() => {
    const modal = dialog.current;
    if (!modal) return;
    const y = window.scrollY;
    const body = document.body;
    const original = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    modal.showModal();
    normalButton.current?.focus({ preventScroll: true });
    return () => {
      modal.close();
      Object.assign(body.style, original);
      window.scrollTo(0, y);
    };
  }, []);

  // One timer per phase. Skipping, resetting, disabling the mode or navigating
  // away cancels it; repeated pointer/click events cannot start a second sequence.
  useEffect(() => {
    if (phase !== "intro" && phase !== "charging" && phase !== "burst") return;
    const timer = window.setTimeout(
      () => {
        const next = phase === "intro" ? "sealed"
          : phase === "charging" ? "burst" : "reveal";
        phaseRef.current = next;
        setPhase(next);
      },
      phase === "intro" ? (reduceMotion ? 800 : 2200)
        : reduceMotion ? 0 : phase === "charging" ? 360 : 1100,
    );
    return () => window.clearTimeout(timer);
  }, [phase, reduceMotion]);

  // A fresh timeout for each visible work prevents catch-up bursts after a pause.
  // The last card gets its full second after the short entrance animation.
  useEffect(() => {
    if (phase !== "reveal" || paused) return;
    autoTimer.current = window.setTimeout(() => {
      if (phaseRef.current !== "reveal") return;
      if (index < worksData.length - 1) setIndex(index + 1);
      else moveTo("collection");
    }, index === worksData.length - 1 && !reduceMotion ? 1200 : 1000);
    return () => window.clearTimeout(autoTimer.current);
  }, [phase, index, paused, reduceMotion]);

  useEffect(() => {
    const visibility = () => {
      stopAuto();
      setPageHidden(document.hidden);
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      stopAuto();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  useEffect(() => {
    if (phase === "reveal" && !isMuted) playReveal();
  }, [phase, index, isMuted]);

  useEffect(() => {
    if (phase === previousPhase.current) return;
    previousPhase.current = phase;
    if (phase === "reveal") revealTitle.current?.focus({ preventScroll: true });
    if (phase === "collection") {
      sceneContent.current?.scrollTo(0, 0);
      collectionTitle.current?.focus({ preventScroll: true });
    }
    if (phase === "sealed") packElement.current?.focus({ preventScroll: true });
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
    setIsDragging(true);
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
    setIsDragging(false);
    if (phaseRef.current === "sealed") setProgress(0);
  };
  const work = worksData[index];
  const opened = phase === "burst";

  return (
    <section
      className={className}
      aria-label="作品カードパック"
      data-phase={phase}
    >
        <dialog
          ref={dialog}
          className={`stage phase-${phase}`}
          aria-label="SSR作品パック開封"
          onCancel={(event) => { event.preventDefault(); disable(); }}
          onKeyDown={(event) => {
            if (event.repeat) return;
            if (event.key.toLowerCase() === "r" && phase === "collection") reset();
            if (event.key.toLowerCase() === "p" && phase === "reveal") {
              stopAuto();
              setManualPause(!manualPause);
            }
          }}
        >
          <p className="srOnly" role="status" aria-live="polite">
            {phase === "intro" ? "SSR確定。すべての作品がスペシャルレア。" : phase === "sealed"
              ? "パックの切り口を左右になぞって開封。キーボードではパックにフォーカスしてEnterまたはスペース。"
              : phase === "reveal"
                ? `SSR ${index + 1}枚目、全${worksData.length}枚。${work.title}`
                : phase === "collection" ? "すべての作品を表示しました。Rキーで再開封できます。" : "パックを開封しています。"}
          </p>
          <div className="stageGrid" aria-hidden="true" />
          <div className="ambient" aria-hidden="true" />
          <div ref={sceneContent} className="sceneContent">
          {phase === "intro" && (
            <div className="guarantee">
              <div className="guaranteeLight" aria-hidden="true" />
              <p>この出会いは、特別。</p>
              <h2><span>SSR</span>確定</h2>
              <p className="guaranteeCaption">{worksData.length} WORKS · ALL SPECIAL SUPER RARE</p>
            </div>
          )}
          {(phase === "sealed" ||
            phase === "charging" ||
            phase === "burst") && (
            <div className="packScene">
              {opened && <div className="burstRing" aria-hidden="true" />}
              {opened && (
                <div className="flyingCards" aria-hidden="true">
                  {worksData.map((item, i) => (
                    <div
                      key={item.slug}
                      className="flyingCard"
                      style={
                        {
                          "--fan-x": `${(i - (worksData.length - 1) / 2) * 52}px`,
                          "--fan-y": `${-210 - i * 26}px`,
                          "--fan-angle": `${(i - (worksData.length - 1) / 2) * 11}deg`,
                          animationDelay: `${i * 55}ms`,
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
                ref={packElement}
                className="pack"
                role={phase === "sealed" ? "button" : undefined}
                tabIndex={phase === "sealed" ? 0 : undefined}
                aria-label={phase === "sealed" ? "作品パックを開封（左右になぞる、Enterまたはスペース）" : undefined}
                onKeyDown={(event) => {
                  if (phase !== "sealed" || event.repeat) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    open();
                  }
                }}
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
                  {phase === "sealed" && !isDragging && progress === 0 && (
                    <div className="swipeGuide"><TbHandFinger size={36} /></div>
                  )}
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
                    duration: reduceMotion ? 0.1 : 0.18,
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
                  <h4 ref={revealTitle} tabIndex={-1}>{work.title}</h4>
                  <p>{work.description}</p>
                  <span
                    className="linkInteraction"
                    onPointerEnter={(event) => {
                      if (event.pointerType !== "mouse" || !window.matchMedia("(hover: hover)").matches) return;
                      stopAuto();
                      setLinkHovered(true);
                    }}
                    onPointerLeave={() => setLinkHovered(false)}
                    onFocus={() => { stopAuto(); setLinkFocused(true); }}
                    onBlur={() => setLinkFocused(false)}
                    onPointerDown={() => { stopAuto(); setManualPause(true); }}
                  >
                    <WorkLink work={work} />
                  </span>
                  <div className="cardShine" aria-hidden="true" />
                </motion.article>
              <p className="srOnly" role="status">{paused ? "自動送りを停止中。Pキーで再開。" : "1秒ごとに作品を表示。Pキーで一時停止。"}</p>
              <div className="revealActions">
                <span>
                  {String(index + 1).padStart(2, "0")} /{" "}
                  {String(worksData.length).padStart(2, "0")}
                </span>
              </div>
            </div>
          )}
          {phase === "sealed" && (
            <div className="openActions">
              <p>切り口を指でスワイプ / マウスでドラッグ</p>
            </div>
          )}
          {(phase === "charging" || phase === "burst") && (
            <p className="openingLabel">
              {phase === "charging"
                ? "この中に、つくってきたすべて。"
                : "✦ COLLECTION UNLOCKED ✦"}
            </p>
          )}
          {phase === "collection" && (
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
        </div>
          )}
          </div>
          <div className="bottomControls">
            <button ref={normalButton} onClick={disable}>正気に戻る</button>
          </div>
        </dialog>
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
  .stage {
    position: fixed;
    inset: 0;
    width: 100%;
    max-width: none;
    height: 100vh;
    height: 100dvh;
    max-height: none;
    margin: 0;
    padding: 0;
    isolation: isolate;
    overflow: hidden;
    overscroll-behavior: contain;
    border-radius: 0;
    color: #f5f2ff;
    background: #100d21;
    border: 0;
  }
  .stage::backdrop { background: #100d21; }
  .sceneContent {
    position: absolute;
    inset: 0 0 calc(${DOPAMINE_CONTROLS_SAFE_AREA}px + env(safe-area-inset-bottom));
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: calc(16px + env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) 24px max(16px, env(safe-area-inset-left));
  }
  .bottomControls {
    position: absolute;
    bottom: calc(16px + env(safe-area-inset-bottom));
    left: 50%;
    transform: translateX(-50%);
    z-index: 5;
  }
  .bottomControls button {
    height: 36px;
    padding: 0 20px;
    border: 2px solid #333;
    border-radius: 999px;
    background: #fffff8;
    color: #333;
    font-size: 12px;
    white-space: nowrap;
  }
  .pack:focus-visible {
    outline: 3px solid #fc69dc;
    outline-offset: 8px;
  }
  .guarantee {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: calc(100dvh - 104px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
    text-align: center;
    isolation: isolate;
  }
  .guaranteeLight {
    position: absolute;
    z-index: -1;
    width: min(75vw, 650px);
    aspect-ratio: 1;
    border-radius: 50%;
    background: conic-gradient(from 45deg, transparent, #f6cf8355, transparent, #ed89e555, transparent, #f6cf8355, transparent);
    filter: blur(24px);
    animation: guaranteeLight 2.2s ease-out both;
  }
  .guarantee > p { color: #e2c5ef; letter-spacing: .22em; font-size: 12px; }
  .guarantee h2 {
    margin: 22px 0;
    color: #ffebad;
    font-size: clamp(58px, 13vw, 150px);
    font-weight: 900;
    line-height: 1;
    letter-spacing: -.05em;
    text-shadow: 0 0 40px #f0b25f80;
    animation: guaranteeType 2.2s cubic-bezier(.16,1,.3,1) both;
  }
  .guarantee h2 span { display: block; font-size: 1.45em; font-style: italic; }
  .guarantee .guaranteeCaption { font-size: 9px; letter-spacing: .18em; }
  @keyframes guaranteeType {
    0% { opacity: 0; transform: scale(.72); filter: blur(16px); }
    24% { opacity: 1; transform: scale(.88); filter: blur(0); }
    52% { transform: scale(.88); }
    64%, 90% { transform: scale(1); opacity: 1; }
    100% { transform: scale(1.06); opacity: 0; }
  }
  @keyframes guaranteeLight {
    0% { opacity: 0; transform: scale(.4) rotate(-30deg); }
    55% { opacity: .4; }
    70% { opacity: 1; transform: scale(1.2) rotate(20deg); }
    100% { opacity: 0; transform: scale(1.6) rotate(40deg); }
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
  .packScene {
    position: relative;
    width: 248px;
    height: 365px;
    margin: max(130px, calc((100dvh - 450px) / 2)) auto 0;
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
  .swipeGuide {
    position: absolute;
    top: 24px;
    left: calc(50% - 18px);
    color: #fff3b7;
    filter: drop-shadow(0 2px 5px #1b0c32);
    pointer-events: none;
    animation: swipeGuide 1.6s ease-in-out infinite;
  }
  @keyframes swipeGuide {
    0%, 15% { transform: translateX(-58px) rotate(-18deg); opacity: .5; }
    60%, 75% { transform: translateX(58px) rotate(-18deg); opacity: 1; }
    100% { transform: translateX(-58px) rotate(-18deg); opacity: .5; }
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
  .phase-charging .pack {
    animation: anticipate 0.36s ease-in forwards;
  }
  .phase-charging .tearZone,
  .phase-burst .tearZone {
    display: none;
  }
  .phase-burst .packLid {
    animation: lidAway 0.65s ease-out forwards;
  }
  .phase-burst .packBody {
    animation: bodyAway 0.8s ease-in forwards;
  }
  .phase-burst .packShadow {
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
    z-index: 1;
    pointer-events: none;
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
    animation: cardBurst 0.85s cubic-bezier(0.1, 0.8, 0.2, 1) both;
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
  .linkInteraction { display: inline-block; }
  .revealActions > span {
    font-size: 11px;
    color: #b5a8c6;
    letter-spacing: 0.1em;
    white-space: nowrap;
  }
  .collection {
    max-width: 1000px;
    margin: 16px auto 0;
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
    .packScene {
      width: 222px;
    }
    .packTitle {
      font-size: 43px;
    }
  }
  @media (min-height: 800px) {
    .revealScene { padding-top: max(45px, calc((100dvh - 740px) / 2)); }
  }
  @media (max-height: 720px) {
    .packScene { margin-top: 95px; height: 300px; width: 215px; }
    .packTitle { margin-top: 18px; font-size: 38px; }
    .packCaption { margin-top: 9px; }
    .packFooter { bottom: 20px; }
    .openActions { margin-top: 38px; }
    .revealScene { padding-top: 10px; }
    .heroCard { max-width: 300px; }
    .heroCard img { max-height: 140px; }
    .revealActions { margin-top: 16px; }
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
      transform: translateY(70px) scale(0.75);
      opacity: 0;
    }
    12% {
      opacity: 1;
    }
    85% {
      transform: translate(var(--fan-x), var(--fan-y)) rotate(var(--fan-angle)) scale(0.86);
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
