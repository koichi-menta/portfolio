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

// この間隔を空けずにメニューを連続で開閉するとドーパミンモードになる
const COMBO_INTERVAL_MS = 1000;
const COMBO_CLICKS_TO_TRIGGER = 6;

export type ContainerProps = {};
type Props = {
  className?: string;
  isOpen: boolean;
  isDopamine: boolean;
  combo: number;
  handleClick: () => void;
} & ContainerProps;

const Component = ({
  className,
  isOpen,
  isDopamine,
  combo,
  handleClick,
}: Props): JSX.Element => (
  <div className={className}>
    <div
      className={clsx(
        "card",
        combo >= 2 && "shake",
        combo >= 4 && "shakeHard"
      )}
    >
      <MenuCard
        onClick={handleClick}
        variant={isDopamine ? "gradient" : "solid"}
      />
    </div>
    <div className={clsx("circle", isOpen && "animate")}>
      <div className={clsx("menuItem", "menu1", isOpen && "animate")}>
        <Link href="/timeline" className="link">
          <MenuItem>
            <TbTimelineEvent className="icon" strokeWidth={1} color="#333" />
            <p className="text">タイムライン</p>
          </MenuItem>
        </Link>
      </div>
      <div className={clsx("menuItem", "menu2", isOpen && "animate")}>
        <Link href="/faq" className="link">
          <MenuItem>
            <TbBrandWechat className="icon" strokeWidth={1} color="#333" />
            <p className="text">よくある質問</p>
          </MenuItem>
        </Link>
      </div>
      <div className={clsx("menuItem", "menu3", isOpen && "animate")}>
        <Link href="/profile" className="link">
          <MenuItem>
            <TbUserCircle className="icon" strokeWidth={1} color="#333" />
            <p className="text">プロフィール</p>
          </MenuItem>
        </Link>
      </div>
      <div className={clsx("menuItem", "menu4", isOpen && "animate")}>
        <Link href="/works" className="link">
          <MenuItem>
            <TbAppWindow className="icon" strokeWidth={1} color="#333" />
            <p className="text">作品</p>
          </MenuItem>
        </Link>
      </div>
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
  const { isDopamine, enable } = useDopamineMode();
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
      COMBO_INTERVAL_MS
    );
  }, [combo, isDopamine, enable]);

  return (
    <StyledComponent
      {...props}
      isOpen={isOpen}
      isDopamine={isDopamine}
      combo={combo}
      handleClick={handleClick}
    />
  );
};
