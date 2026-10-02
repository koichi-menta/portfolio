import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import styled, { createGlobalStyle } from "styled-components";

type DopagakiModeValue = {
  isDopagaki: boolean;
  enable: () => void;
  disable: () => void;
};

const DopagakiModeContext = createContext<DopagakiModeValue>({
  isDopagaki: false,
  enable: () => {},
  disable: () => {},
});

// ドパガキモード中は背景をネオンカラーでうねらせる
const DopagakiGlobalStyle = createGlobalStyle`
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
    animation: dopagaki-background 6s ease-in-out infinite;
  }
  @keyframes dopagaki-background {
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
export const DopagakiModeProvider = ({ children }: Props): JSX.Element => {
  const [isDopagaki, setIsDopagaki] = useState<boolean>(false);

  const enable = useCallback(() => setIsDopagaki(true), []);
  const disable = useCallback(() => setIsDopagaki(false), []);

  const value = useMemo(
    () => ({ isDopagaki, enable, disable }),
    [isDopagaki, enable, disable]
  );

  return (
    <DopagakiModeContext.Provider value={value}>
      {children}
      {isDopagaki && (
        <>
          <DopagakiGlobalStyle />
          <BackToSanityButton onClick={disable} />
        </>
      )}
    </DopagakiModeContext.Provider>
  );
};

export const useDopagakiMode = (): DopagakiModeValue =>
  useContext(DopagakiModeContext);
