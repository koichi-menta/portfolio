import React, { useState, useCallback, useEffect, useRef } from "react";
import styled from "styled-components";
import { MenuCard } from "src/components/parts/MenuCard";
import clsx from "clsx";
import { MenuItem } from "./MenuItem";
import Link from "next/link";
import {
  TbTimelineEvent,
  TbBrandWechat,
  TbUserCircle,
  TbAppWindow,
} from "react-icons/tb";
import { device } from "src/constants/breakpoints";
import { useDopamineMode } from "src/contexts/DopamineMode";
import { motion, useReducedMotion } from "framer-motion";
import { useBeat } from "src/hooks/useBeat";

// この間隔を空けずにメニューを連続で開閉するとドーパミンモードになる
const COMBO_INTERVAL_MS = 1000;
const COMBO_CLICKS_TO_TRIGGER = 6;
// ドーパミンモード中のトップで鳴らすビートのテンポ
const BEAT_BPM = 128;

export type ContainerProps = {};
type Props = {
  className?: string;
  isOpen: boolean;
  isDopamine: boolean;
  combo: number;
  beat: number;
  showPulse: boolean;
  handleClick: () => void;
} & ContainerProps;

const MENU_ITEMS = [
  {
    className: "menu1",
    href: "/timeline",
    Icon: TbTimelineEvent,
    label: "タイムライン",
  },
  {
    className: "menu2",
    href: "/faq",
    Icon: TbBrandWechat,
    label: "よくある質問",
  },
  {
    className: "menu3",
    href: "/profile",
    Icon: TbUserCircle,
    label: "プロフィール",
  },
  { className: "menu4", href: "/works", Icon: TbAppWindow, label: "作品" },
];

type PulseProps = {
  beat: number;
  delay: number;
};

// 枠から外へ広がって消える波紋。クリックできる範囲は変えないよう、枠とは別の要素で描く
const Pulse = ({ beat, delay }: PulseProps): JSX.Element => (
  <motion.span
    className="pulse"
    style={{ borderColor: `hsl(${(beat * 47) % 360}, 100%, 60%)` }}
    initial={{ scale: 1.06, opacity: 0.8 }}
    animate={{ scale: 1.35, opacity: 0 }}
    transition={{ duration: 0.45, delay, ease: "easeOut" }}
  />
);

const Component = ({
  className,
  isOpen,
  isDopamine,
  combo,
  beat,
  showPulse,
  handleClick,
}: Props): JSX.Element => (
  <div className={className}>
    <div
      className={clsx("card", combo >= 2 && "shake", combo >= 4 && "shakeHard")}
    >
      <MenuCard
        onClick={handleClick}
        variant={isDopamine ? "gradient" : "solid"}
      />
    </div>
    {showPulse && <Pulse key={`card-${beat}`} beat={beat} delay={0} />}
    <div className={clsx("circle", isOpen && "animate")}>
      {MENU_ITEMS.map(({ className: itemClassName, href, Icon, label }, i) => (
        <div
          key={href}
          className={clsx(
            "menuItem",
            itemClassName,
            isOpen && "animate",
            isDopamine && "dopamine",
          )}
        >
          {/* 拍ごとに4つのメニューへ順番に波紋が伝わり、音の波形のように見せる */}
          {showPulse && (
            <Pulse key={`${href}-${beat}`} beat={beat} delay={(i + 1) * 0.06} />
          )}
          <Link href={href} className="link">
            <MenuItem>
              <Icon className="icon" strokeWidth={1} color="#333" />
              <p className="text">{label}</p>
            </MenuItem>
          </Link>
        </div>
      ))}
    </div>
  </div>
);

const StyledComponent = styled(Component)`
  display: inline-block;
  position: relative;
  /* 連打が続くほど揺れが大きくなり、あと少しで何か起きそうだと知らせる */
  > .card {
    /* 揺れ(transform)で重なり順の基準が変わっても、カードを円より前面に保つ */
    position: relative;
    z-index: 1;
    &.shake {
      animation: menu-card-shake 0.3s linear infinite;
    }
    &.shakeHard {
      animation-duration: 0.15s;
      filter: drop-shadow(0 0 8px #ff6ad5);
    }
  }
  @keyframes menu-card-shake {
    0% {
      transform: translate(0, 0) rotate(0);
    }
    25% {
      transform: translate(-2px, 1px) rotate(-3deg);
    }
    50% {
      transform: translate(1px, -2px) rotate(2deg);
    }
    75% {
      transform: translate(2px, 1px) rotate(-2deg);
    }
    100% {
      transform: translate(0, 0) rotate(0);
    }
  }
  > .pulse {
    /* ロゴカード(100px角)と同じ位置・形 */
    top: 0;
    left: 0;
    width: 100px;
    height: 100px;
    border-radius: 20px;
  }
  .pulse {
    position: absolute;
    border: 3px solid;
    pointer-events: none;
  }
  @keyframes menu-item-rainbow {
    0% {
      background-position:
        0 0,
        0% 50%;
    }
    100% {
      background-position:
        0 0,
        200% 50%;
    }
  }
  > .circle {
    width: 330px;
    height: 330px;
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(0);
    transition: 0.5s ease-in-out;

    @media (${device.tablet}) {
      width: 500px;
      height: 500px;
    }

    &.animate {
      transform: translate(-50%, -50%) rotate(360deg);
    }
    > .menuItem {
      position: absolute;
      opacity: 0;
      transition: 0.5s ease-in-out;

      > .link {
        color: black;
        text-decoration: none;
        .text {
          font-size: 10px;
        }
        .icon {
          width: 60px;
          height: 60px;
          @media (${device.tablet}) {
            width: 90px;
            height: 90px;
          }
        }
      }

      &.animate {
        opacity: 1;
      }
      > .pulse {
        inset: 0;
        border-radius: 10px;
      }
      /* 内側を背景色、外周だけ流れる虹色にして枠線に見せる */
      &.dopamine .link > div {
        border-color: transparent;
        background:
          linear-gradient(#fffff8, #fffff8) padding-box,
          linear-gradient(
              90deg,
              red,
              orange,
              yellow,
              lime,
              cyan,
              blue,
              magenta,
              red
            )
            border-box;
        background-size:
          100% 100%,
          200% 100%;
        animation: menu-item-rainbow 2s linear infinite;
      }
      &.menu1 {
        right: 50%;
        top: 50%;
        transform: translate(50%, -50%) rotate(0) scale(0);
        &.animate {
          right: 0;
          top: 0;
          transform: translate(0, 0) rotate(-360deg) scale(1);
        }
      }
      &.menu2 {
        right: 50%;
        bottom: 50%;
        transform: translate(50%, 50%) rotate(0) scale(0);
        &.animate {
          right: 0;
          bottom: 0;
          transform: translate(0, 0) rotate(-360deg) scale(1);
        }
      }
      &.menu3 {
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%) rotate(0) scale(0);
        &.animate {
          left: 0;
          top: 0;
          transform: translate(0, 0) rotate(-360deg) scale(1);
        }
      }
      &.menu4 {
        left: 50%;
        bottom: 50%;
        transform: translate(-50%, 50%) rotate(0) scale(0);
        &.animate {
          left: 0;
          bottom: 0;
          transform: translate(0, 0) rotate(-360deg) scale(1);
        }
      }
    }
  }
`;

export const Menu = (props: ContainerProps): JSX.Element => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [combo, setCombo] = useState<number>(0);
  const { isDopamine, isMuted, enable } = useDopamineMode();
  const beat = useBeat(BEAT_BPM, isDopamine, isMuted);
  const shouldReduceMotion = useReducedMotion();
  const lastClickedAtRef = useRef<number>(0);
  const comboResetTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(comboResetTimerRef.current), []);

  const handleClick = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (isDopamine) return;

    // ページ遷移でこのコンポーネントがアンマウントされるので、回数も自然にリセットされる
    const now = Date.now();
    const nextCombo =
      now - lastClickedAtRef.current < COMBO_INTERVAL_MS ? combo + 1 : 1;
    lastClickedAtRef.current = now;
    clearTimeout(comboResetTimerRef.current);

    if (nextCombo >= COMBO_CLICKS_TO_TRIGGER) {
      setCombo(0);
      enable();
      return;
    }
    setCombo(nextCombo);
    comboResetTimerRef.current = setTimeout(
      () => setCombo(0),
      COMBO_INTERVAL_MS,
    );
  }, [combo, isDopamine, enable]);

  return (
    <StyledComponent
      {...props}
      isOpen={isOpen}
      isDopamine={isDopamine}
      combo={combo}
      beat={beat}
      showPulse={isDopamine && beat > 0 && !shouldReduceMotion}
      handleClick={handleClick}
    />
  );
};
