import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import styled, { createGlobalStyle } from "styled-components";

type DopamineModeValue = {
  isDopamine: boolean;
  enable: () => void;
  disable: () => void;
};

const DopamineModeContext = createContext<DopamineModeValue>({
  isDopamine: false,
  enable: () => {},
  disable: () => {},
});

// ドーパミンモード中は背景をネオンカラーでうねらせる
const DopamineGlobalStyle = createGlobalStyle`
  body {
    background: linear-gradient(
      120deg,
      #ffd1f5,
      #fff6a8,
      #b8ffe0,
      #b8e4ff,
      #e2c4ff,
      #ffd1f5
    );
    background-size: 400% 400%;
    animation: dopamine-background 6s ease-in-out infinite;
  }
  @keyframes dopamine-background {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`;

// 発動演出の重なり順。トップのロゴはこれより前面に出して、虹色の上に残す
export const DOPAMINE_BURST_Z_INDEX = 50;

// 発動の瞬間、画面中央のロゴから虹色が広がって画面を染め、溶けるように新しい背景が現れる
const RainbowBurst = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${DOPAMINE_BURST_Z_INDEX};
  pointer-events: none;
  background: conic-gradient(
    red,
    orange,
    yellow,
    lime,
    cyan,
    blue,
    magenta,
    red
  );
  animation: dopamine-burst 1.6s ease-out forwards;

  @keyframes dopamine-burst {
    0% {
      clip-path: circle(0% at 50% 50%);
      filter: hue-rotate(0deg);
      opacity: 1;
    }
    40% {
      clip-path: circle(75% at 50% 50%);
      opacity: 1;
    }
    100% {
      clip-path: circle(75% at 50% 50%);
      filter: hue-rotate(360deg);
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`;

type BackToSanityButtonProps = {
  className?: string;
  onClick: () => void;
};

const BackToSanityButtonComponent = ({
  className,
  onClick,
}: BackToSanityButtonProps): JSX.Element => (
  <button type="button" className={className} onClick={onClick}>
    正気に戻る
  </button>
);

const BackToSanityButton = styled(BackToSanityButtonComponent)`
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  padding: 8px 20px;
  border: 2px solid #333;
  border-radius: 999px;
  background-color: #fffff8;
  color: #333;
  font-size: 12px;
  cursor: pointer;
`;

type Props = {
  children: ReactNode;
};

// 状態はメモリ上にのみ持つので、ページ遷移では維持されリロードで元に戻る
export const DopamineModeProvider = ({ children }: Props): JSX.Element => {
  const [isDopamine, setIsDopamine] = useState<boolean>(false);

  const enable = useCallback(() => setIsDopamine(true), []);
  const disable = useCallback(() => setIsDopamine(false), []);

  const value = useMemo(
    () => ({ isDopamine, enable, disable }),
    [isDopamine, enable, disable]
  );

  return (
    <DopamineModeContext.Provider value={value}>
      {children}
      {isDopamine && (
        <>
          <DopamineGlobalStyle />
          <RainbowBurst />
          <BackToSanityButton onClick={disable} />
        </>
      )}
    </DopamineModeContext.Provider>
  );
};

export const useDopamineMode = (): DopamineModeValue =>
  useContext(DopamineModeContext);
