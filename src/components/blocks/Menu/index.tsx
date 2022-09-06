import React, { useState, Dispatch, SetStateAction, useCallback } from "react";
import styled from "styled-components";
import { MenuCard } from "src/components/parts/MenuCard";
import clsx from "clsx";

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
        プロフィール
      </div>
      <div className={clsx("menuItem", "menu2", isOpen && "animate")}>
        スキル
      </div>
      <div className={clsx("menuItem", "menu3", isOpen && "animate")}>
        タイムライン
      </div>
      <div className={clsx("menuItem", "menu4", isOpen && "animate")}>作品</div>
    </div>
  </div>
);

const StyledComponent = styled(Component)`
  display: inline-block;
  position: relative;
  > .circle {
    width: 300px;
    height: 300px;
    border-radius: 50%;
    border: 1px solid;
    position: absolute;
    top: 50%;
    left: 50%;
    transition: 1.5s ease-in-out;
    transform: translate(-50%, -50%) rotate(0);
    &.animate {
      transform: translate(-50%, -50%) rotate(720deg);
    }
    > .menuItem {
      width: 100px;
      height: 100px;
      border: 1px solid;
      position: absolute;
      transition: 1.5s ease-in-out;
      &.menu1 {
        left: 50%;
        top: 0;
        transform: translate(50%, 0) rotate(0);
        &.animate {
          transform: translate(50%, 0) rotate(-720deg);
        }
      }
      &.menu2 {
        left: 50%;
        top: 50%;
        transform: translate(50%, 50%) rotate(0);
        &.animate {
          transform: translate(50%, 50%) rotate(-720deg);
        }
      }
      &.menu3 {
        left: 0;
        top: 0;
        transform: translate(0, 0) rotate(0);
        &.animate {
          transform: translate(0, 0) rotate(-720deg);
        }
      }
      &.menu4 {
        left: 0;
        top: 100%;
        transform: translate(0, -100%) rotate(0);
        &.animate {
          transform: translate(0, -100%) rotate(-720deg);
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
