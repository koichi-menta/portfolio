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
    width: 500px;
    height: 500px;
    border-radius: 50%;
    /* border: 1px solid; */
    position: absolute;
    top: 50%;
    left: 50%;
    transition: 1s ease-in-out;
    transform: translate(-50%, -50%) rotate(0);
    &.animate {
      transform: translate(-50%, -50%) rotate(720deg);
    }
    > .menuItem {
      width: 150px;
      height: 150px;
      border: 1px solid;
      position: absolute;
      transition: 1s ease-in-out;
      opacity: 0;
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
          transform: translate(0, 0) rotate(-720deg) scale(1);
        }
      }
      &.menu2 {
        right: 50%;
        bottom: 50%;
        transform: translate(50%, 50%) rotate(0) scale(0);
        &.animate {
          right: 0;
          bottom: 0;
          transform: translate(0, 0) rotate(-720deg) scale(1);
        }
      }
      &.menu3 {
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%) rotate(0) scale(0);
        &.animate {
          left: 0;
          top: 0;
          transform: translate(0, 0) rotate(-720deg) scale(1);
        }
      }
      &.menu4 {
        left: 50%;
        bottom: 50%;
        transform: translate(-50%, 50%) rotate(0) scale(0);
        &.animate {
          left: 0;
          bottom: 0;
          transform: translate(0, 0) rotate(-720deg) scale(1);
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
