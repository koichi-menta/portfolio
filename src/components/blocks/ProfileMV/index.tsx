import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import Image from "next/image";
import Link from "next/link";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useAnimate,
  useReducedMotion,
} from "framer-motion";
import { TbBrandGithub, TbBrandTwitter, TbX } from "react-icons/tb";
import profile_image from "public/profile_icon.jpeg";
import { DopamineButton } from "src/components/parts/DopamineButton";
import {
  DOPAMINE_CONTROLS_SAFE_AREA,
  useDopamineMode,
} from "src/contexts/DopamineMode";
import {
  playBass,
  playBurst,
  playHat,
  playKick,
  playReveal,
  unlock,
} from "src/lib/dopamineSound";

const BPM = 128;
const HALF_BEAT_MS = 60000 / BPM / 2;

// 台本の各場面。長さは拍数で持ち、映像も音も同じ拍で進める
type SceneId =
  | "intro"
  | "frontend"
  | "stack"
  | "but"
  | "backend"
  | "api"
  | "personal"
  | "nest"
  | "testDesign"
  | "ai"
  | "teamFirst";

type Scene = {
  id: SceneId;
  beats: number;
  // kickOnly: キックだけ / break: 無音 / full: キック・ハイハット / band: ベースも入る
  sound: "kickOnly" | "break" | "full" | "band";
};

const SCENES: Scene[] = [
  { id: "intro", beats: 8, sound: "kickOnly" },
  { id: "frontend", beats: 4, sound: "full" },
  { id: "stack", beats: 4, sound: "full" },
  { id: "but", beats: 2, sound: "break" },
  { id: "backend", beats: 4, sound: "band" },
  { id: "api", beats: 4, sound: "band" },
  { id: "personal", beats: 4, sound: "band" },
  { id: "nest", beats: 4, sound: "band" },
  { id: "testDesign", beats: 4, sound: "band" },
  { id: "ai", beats: 4, sound: "band" },
  { id: "teamFirst", beats: 4, sound: "band" },
];

// Am → F → C → G を1小節ずつ
const BASS_NOTES = [55, 43.65, 65.41, 49];

const STACK_WORDS = [
  { text: "React", position: "top" },
  { text: "TypeScript", position: "right" },
  { text: "Next.js", position: "bottom" },
  { text: "GraphQL", position: "left" },
];

const AI_TOOLS = ["Claude", "Cursor", "Codex"];

// 言葉が画面に叩きつけられるように出る
const Slam = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}): JSX.Element => (
  <motion.p
    className={`caption ${className}`}
    initial={{ scale: 2.6, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ opacity: 0, transition: { duration: 0.1 } }}
    transition={{ type: "spring", stiffness: 600, damping: 24 }}
  >
    {children}
  </motion.p>
);

type CaptionsProps = {
  sceneId: SceneId;
  beat: number;
};

// 場面ごとの文字。beat は場面の中で何拍目か（0 始まり）
const Captions = ({ sceneId, beat }: CaptionsProps): JSX.Element | null => {
  switch (sceneId) {
    case "intro":
      return beat >= 1 ? (
        <p className="caption title glitch" data-text="Koichi">
          Koichi
        </p>
      ) : null;
    case "frontend":
      return (
        <AnimatePresence mode="wait">
          {beat < 2 ? (
            <Slam key="front">フロントエンド</Slam>
          ) : (
            <Slam key="engineer">エンジニア</Slam>
          )}
        </AnimatePresence>
      );
    case "but":
      return <Slam className="huge">でも</Slam>;
    case "backend":
      return (
        <>
          <Slam>バックエンドも わかる</Slam>
          {beat >= 2 && (
            <motion.p
              className="sub"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              Laravel 経験あり
            </motion.p>
          )}
        </>
      );
    case "api":
      return beat < 2 ? (
        <div className="pair">
          <motion.p
            className="caption small"
            initial={{ x: -120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            API設計
          </motion.p>
          {beat >= 1 && (
            <motion.p
              className="caption small"
              initial={{ x: 120, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            >
              データの持ち方
            </motion.p>
          )}
        </div>
      ) : (
        <Slam className="small">考えてから、フロントを組む</Slam>
      );
    case "personal":
      return (
        <AnimatePresence mode="wait">
          {beat < 2 ? (
            <Slam key="personal">個人開発で</Slam>
          ) : (
            <Slam key="supabase" className="supabase">
              Supabase
            </Slam>
          )}
        </AnimatePresence>
      );
    case "nest":
      return (
        <>
          <Slam>NestJS</Slam>
          <div className="loading">
            {/* 99% で止まって終わらない */}
            <motion.div
              className="bar"
              initial={{ width: "0%" }}
              animate={{ width: "99%" }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </div>
          <p className="sub learning">学習中... 99%</p>
        </>
      );
    case "testDesign":
      return (
        <AnimatePresence mode="wait">
          {beat < 2 ? (
            <motion.div key="test" className="stack" exit={{ opacity: 0 }}>
              <Slam>テストも</Slam>
              <p className="sub">Playwright / Testing Library</p>
            </motion.div>
          ) : (
            <motion.div key="design" className="stack" exit={{ opacity: 0 }}>
              <Slam>デザインも</Slam>
              <p className="sub">Figma</p>
            </motion.div>
          )}
        </AnimatePresence>
      );
    case "ai":
      return (
        <>
          <Slam>相棒は AI</Slam>
          <div className="chips">
            {AI_TOOLS.slice(0, Math.max(0, beat)).map((tool) => (
              <motion.span
                key={tool}
                className="chip"
                initial={{ y: 20, scale: 0.5, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                {tool}
              </motion.span>
            ))}
          </div>
        </>
      );
    case "teamFirst":
      return (
        <AnimatePresence mode="wait">
          {beat < 2 ? (
            <Slam key="important">大事なのは</Slam>
          ) : (
            <Slam key="team" className="climax">
              チームファースト
            </Slam>
          )}
        </AnimatePresence>
      );
    default:
      return null;
  }
};

export type ContainerProps = {};
type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ className }: Props): JSX.Element => {
  const { isMuted } = useDopamineMode();
  const shouldReduceMotion = useReducedMotion();
  // -1: 開始前 / 0〜: 再生中の場面 / SCENES.length: 終わりの画面
  const [sceneIndex, setSceneIndex] = useState<number>(-1);
  const [beatInScene, setBeatInScene] = useState<number>(0);
  const [round, setRound] = useState<number>(0);
  const [avatarScope, animateAvatar] = useAnimate();
  const mutedRef = useRef<boolean>(isMuted);
  mutedRef.current = isMuted;
  const sceneIndexRef = useRef<number>(-1);
  const beatInSceneRef = useRef<number>(0);
  const barRef = useRef<number>(0);

  const isPlaying = sceneIndex >= 0 && sceneIndex < SCENES.length;
  const isDone = sceneIndex >= SCENES.length;
  const scene = isPlaying ? SCENES[sceneIndex] : null;

  const goToScene = useCallback((index: number) => {
    sceneIndexRef.current = index;
    beatInSceneRef.current = 0;
    setSceneIndex(index);
    setBeatInScene(0);
  }, []);

  const start = useCallback(() => {
    unlock();
    barRef.current = 0;
    setRound((prev) => prev + 1);
    goToScene(0);
  }, [goToScene]);

  // ページを開いたら自動で始める
  useEffect(() => {
    start();
  }, [start]);

  // 半拍ごとに進むビート。表拍で音を鳴らして拍を進め、場面の長さに達したら次の場面へ
  useEffect(() => {
    if (!isPlaying) return;
    let half = 0;
    const tick = () => {
      let current = SCENES[sceneIndexRef.current];
      if (!current) return;
      const muted = mutedRef.current;
      if (half % 2 === 1) {
        if (!muted && (current.sound === "full" || current.sound === "band"))
          playHat();
        half++;
        return;
      }
      half++;
      let beat = beatInSceneRef.current;
      // 場面の長さに達したら、同じ拍で次の場面の1拍目を鳴らす（拍を抜かさない）
      if (beat >= current.beats) {
        const nextIndex = sceneIndexRef.current + 1;
        goToScene(nextIndex);
        if (nextIndex >= SCENES.length) return;
        current = SCENES[nextIndex];
        beat = 0;
      }
      if (!muted && current.sound !== "break") {
        playKick();
        if (current.sound === "band") {
          playBass(BASS_NOTES[Math.floor(barRef.current / 4) % 4]);
          barRef.current++;
        }
      }
      setBeatInScene(beat);
      beatInSceneRef.current = beat + 1;
    };
    tick();
    const id = setInterval(tick, HALF_BEAT_MS);
    return () => clearInterval(id);
    // 場面が変わってもビートは途切れさせず、再生の開始と終了でだけ張り直す
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, round]);

  // 場面の頭の効果音
  useEffect(() => {
    if (isMuted) return;
    if (scene?.id === "teamFirst") playBurst();
    if (isDone) playReveal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneIndex]);

  // アイコンの動き。拍ごとに跳ね、場面によって動きを変える
  useEffect(() => {
    if (!scene || !avatarScope.current) return;
    const el = avatarScope.current;
    // Imperative useAnimate does not inherit MotionConfig's reducedMotion.
    if (shouldReduceMotion) {
      animateAvatar(el, { x: 0, y: 0, scale: 1, rotate: 0 }, { duration: 0 });
      return;
    }
    switch (scene.id) {
      case "intro":
        if (beatInScene === 0)
          animateAvatar(
            el,
            { y: [-400, 0], scale: 1, rotate: 0, x: 0 },
            { duration: 0.35, ease: "easeIn" },
          );
        else animateAvatar(el, { scale: [1.1, 1] }, { duration: 0.3 });
        break;
      case "but":
        animateAvatar(el, { scale: 1, rotate: 0, x: 0 }, { duration: 0.1 });
        break;
      case "backend":
        if (beatInScene === 0)
          animateAvatar(el, { rotate: [0, 360] }, { duration: 0.6 });
        break;
      case "stack": {
        const turns = [0, 12, 0, -12];
        animateAvatar(
          el,
          { rotate: turns[beatInScene % 4], scale: [1.1, 1] },
          { duration: 0.3 },
        );
        break;
      }
      case "api":
        animateAvatar(el, { rotate: [0, 8, 0] }, { duration: 0.4 });
        break;
      case "nest":
        animateAvatar(
          el,
          { x: beatInScene % 2 === 0 ? -10 : 10 },
          { duration: 0.4 },
        );
        break;
      case "teamFirst":
        animateAvatar(
          el,
          { scale: beatInScene >= 2 ? 1.35 : 1, x: 0, rotate: 0 },
          { type: "spring", stiffness: 400 },
        );
        break;
      default:
        animateAvatar(
          el,
          { scale: [1.12, 1], x: 0, rotate: 0 },
          { duration: 0.3 },
        );
    }
  }, [scene, beatInScene, animateAvatar, avatarScope, shouldReduceMotion]);

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={className}
        onClick={() => isPlaying && goToScene(sceneIndexRef.current + 1)}
      >
        <div className="topBar" onClick={(e) => e.stopPropagation()}>
          <Link href="/" className="close" aria-label="トップページに戻る">
            <TbX size={22} />
          </Link>
          {isPlaying && (
            <button
              type="button"
              className="skip"
              onClick={() => goToScene(SCENES.length)}
            >
              スキップ ≫
            </button>
          )}
        </div>

        {/* サビで虹色の光が一面に広がる */}
        {scene?.id === "teamFirst" && beatInScene >= 2 && (
          <motion.div
            className="flood"
            initial={{ clipPath: "circle(0% at 50% 45%)", opacity: 0.9 }}
            animate={{ clipPath: "circle(80% at 50% 45%)", opacity: 0.55 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        )}

        <div className="stage">
          <div className="avatarWrap">
            {scene?.id === "stack" &&
              STACK_WORDS.slice(0, beatInScene + 1).map((word) => (
                <motion.span
                  key={word.text}
                  className={`orbitWord ${word.position}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  {word.text}
                </motion.span>
              ))}
            <div className="avatar" ref={avatarScope}>
              <Image src={profile_image} alt="プロフィール画像" />
            </div>
          </div>

          <div className="captions">
            {scene && (
              <Captions
                key={`${round}-${sceneIndex}`}
                sceneId={scene.id}
                beat={beatInScene}
              />
            )}
            {isDone && (
              <motion.div
                className="ending"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                <p className="caption small">Koichi</p>
                <div className="sns">
                  <a
                    href="https://github.com/koichi-menta"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <TbBrandGithub size={30} title="github" />
                  </a>
                  <a
                    href="https://twitter.com/tukivirtualcoin"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <TbBrandTwitter size={30} title="twitter" />
                  </a>
                </div>
                <p className="notice">
                  採用関係の方は
                  <Link href="/faq" className="link">
                    よくある質問
                  </Link>
                  へ
                </p>
                <DopamineButton onClick={start}>もう一度見る</DopamineButton>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </MotionConfig>
  );
};

const rainbow = `red, orange, yellow, lime, cyan, blue, magenta, red`;

const StyledComponent = styled(Component)`
  position: fixed;
  inset: 0;
  z-index: 90;
  overflow: hidden;
  background: radial-gradient(circle at 50% 40%, #3a1f6e, #0b0820 70%);
  color: #fff;
  cursor: pointer;

  > .topBar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    cursor: default;
    > .close {
      display: flex;
      color: #fff;
    }
    > .skip {
      padding: 6px 14px;
      border: 1px solid rgba(255, 255, 255, 0.6);
      border-radius: 999px;
      background: rgba(0, 0, 0, 0.3);
      color: #fff;
      font-size: 12px;
      cursor: pointer;
    }
  }

  > .flood {
    position: absolute;
    inset: 0;
    background: conic-gradient(${rainbow});
    pointer-events: none;
  }

  > .stage {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 40px;
    height: calc(100svh - ${DOPAMINE_CONTROLS_SAFE_AREA}px);
    padding: 0 16px;
  }

  .avatarWrap {
    position: relative;
    > .avatar {
      width: 140px;
      height: 140px;
      padding: 4px;
      border-radius: 50%;
      background: conic-gradient(${rainbow});
      box-shadow: 0 0 30px rgba(255, 106, 213, 0.6);
      img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }
    }
    > .orbitWord {
      position: absolute;
      white-space: nowrap;
      font-size: 18px;
      font-weight: 900;
      color: #7fdcff;
      text-shadow: 0 0 10px rgba(127, 220, 255, 0.8);
      &.top {
        bottom: calc(100% + 12px);
        left: 50%;
        translate: -50% 0;
      }
      &.bottom {
        top: calc(100% + 12px);
        left: 50%;
        translate: -50% 0;
      }
      &.right {
        left: calc(100% + 8px);
        top: 50%;
        translate: 0 -50%;
      }
      &.left {
        right: calc(100% + 8px);
        top: 50%;
        translate: 0 -50%;
      }
    }
  }

  .captions {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    min-height: 160px;
    width: 100%;
    text-align: center;
    > .pair {
      display: flex;
      gap: 16px;
    }
  }

  .stack {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .caption {
    font-size: clamp(30px, 9vw, 56px);
    font-weight: 900;
    line-height: 1.2;
    text-shadow: 0 0 16px rgba(255, 106, 213, 0.8);
    &.small {
      font-size: clamp(22px, 6vw, 36px);
    }
    &.huge {
      font-size: clamp(48px, 16vw, 96px);
    }
    &.title {
      font-size: clamp(44px, 14vw, 80px);
      letter-spacing: 4px;
    }
    &.supabase {
      color: #3ecf8e;
      text-shadow: 0 0 20px rgba(62, 207, 142, 0.9);
    }
    /* 背景が虹色になるので、白文字に濃い縁取りで読ませる */
    &.climax {
      color: #fff;
      -webkit-text-stroke: 8px #2a1650;
      paint-order: stroke fill;
      text-shadow: 0 6px 0 rgba(0, 0, 0, 0.4);
    }
  }

  /* ノイズが走るように赤と青のずれた文字を重ねる */
  .glitch {
    position: relative;
    &::before,
    &::after {
      content: attr(data-text);
      position: absolute;
      inset: 0;
    }
    &::before {
      color: #ff2a6d;
      animation: profile-glitch 0.4s steps(2) infinite;
      mix-blend-mode: screen;
    }
    &::after {
      color: #05d9e8;
      animation: profile-glitch 0.5s steps(2) infinite reverse;
      mix-blend-mode: screen;
    }
  }

  .sub {
    font-size: 15px;
    opacity: 0.85;
    &.learning {
      animation: profile-blink 1s steps(1) infinite;
    }
  }

  .loading {
    width: min(70vw, 320px);
    height: 10px;
    border-radius: 5px;
    background: rgba(255, 255, 255, 0.2);
    overflow: hidden;
    > .bar {
      height: 100%;
      background: linear-gradient(90deg, ${rainbow});
    }
  }

  .chips {
    display: flex;
    gap: 8px;
    min-height: 36px;
    > .chip {
      padding: 6px 14px;
      border: 2px solid #fff;
      border-radius: 999px;
      font-weight: bold;
    }
  }

  .ending {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    cursor: default;
    > .sns {
      display: flex;
      gap: 16px;
      a {
        color: #fff;
      }
    }
    > .notice {
      font-size: 14px;
      .link {
        margin: 0 4px;
        color: #7fdcff;
      }
    }
  }

  @keyframes profile-glitch {
    0% {
      transform: translate(-3px, 1px);
      clip-path: inset(0 0 60% 0);
    }
    50% {
      transform: translate(3px, -1px);
      clip-path: inset(50% 0 0 0);
    }
    100% {
      transform: translate(-2px, 0);
      clip-path: inset(20% 0 40% 0);
    }
  }
  @keyframes profile-blink {
    50% {
      opacity: 0.2;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .glitch::before, .glitch::after, .sub.learning { animation: none; }
  }
`;

export const ProfileMV = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};
