import React, { useState, useCallback } from "react";
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

export type ContainerProps = {};
type Props = {
  className?: string;
  isOpen: boolean;
  handleClick: () => void;
} & ContainerProps;

const Component = ({ className, isOpen, handleClick }: Props): JSX.Element => (
  <div className={className}>
    <MenuCard onClick={handleClick} />
    <div className={clsx("circle", isOpen && "animate")}>
      <div className={clsx("menuItem", "menu1", isOpen && "animate")}>
        <Link href="/profile" className="link">
          <MenuItem>
            <TbUserCircle size="90px" strokeWidth={1} color="#333" />
            <p className="text">プロフィール</p>
          </MenuItem>
        </Link>
      </div>
      <div className={clsx("menuItem", "menu2", isOpen && "animate")}>
        <Link href="/faq" className="link">
          <MenuItem>
            <TbBrandWechat size="90px" strokeWidth={1} color="#333" />
            <p className="text">よくある質問</p>
          </MenuItem>
        </Link>
      </div>
      <div className={clsx("menuItem", "menu3", isOpen && "animate")}>
        <Link href="/timeline" className="link">
          <MenuItem>
            <TbTimelineEvent size="90px" strokeWidth={1} color="#333" />
            <p className="text">タイムライン</p>
          </MenuItem>
        </Link>
      </div>
      <div className={clsx("menuItem", "menu4", isOpen && "animate")}>
        <Link href="/works" className="link">
          <MenuItem>
            <TbAppWindow size="90px" strokeWidth={1} color="#333" />
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
  > .circle {
    width: 500px;
    height: 500px;
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(0);
    transition: 0.5s ease-in-out;

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

  const handleClick = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  return (
    <StyledComponent {...props} isOpen={isOpen} handleClick={handleClick} />
  );
};
