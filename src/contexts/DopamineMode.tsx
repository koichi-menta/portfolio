import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import styled, { createGlobalStyle } from "styled-components";
import { TbVolume, TbVolumeOff } from "react-icons/tb";
import { playBurst, unlock } from "src/lib/dopamineSound";

type DopamineModeValue = {
  isDopamine: boolean;
  isMuted: boolean;
  enable: () => void;
  disable: () => void;
  toggleMute: () => void;
};

const DopamineModeContext = createContext<DopamineModeValue>({
  isDopamine: false,
  isMuted: false,
  enable: () => {},
  disable: () => {},
  toggleMute: () => {},
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

// 画面下に常に出す操作ボタンの帯の高さ。各ページのボタンはこの分だけ上に置いて重ならないようにする
export const DOPAMINE_CONTROLS_SAFE_AREA = 72;

type ControlsProps = {
  className?: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onDisable: () => void;
};

const ControlsComponent = ({
  className,
  isMuted,
  onToggleMute,
  onDisable,
}: ControlsProps): JSX.Element => (
  <div className={className}>
    <button type="button" className="button" onClick={onDisable}>
      正気に戻る
    </button>
    <button
      type="button"
      className="button mute"
      onClick={onToggleMute}
      aria-label={isMuted ? "音を出す" : "音を消す"}
    >
      {isMuted ? <TbVolumeOff size={16} /> : <TbVolume size={16} />}
    </button>
  </div>
);

const Controls = styled(ControlsComponent)`
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  gap: 8px;
  > .button {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    padding: 0 20px;
    border: 2px solid #333;
    border-radius: 999px;
    background-color: #fffff8;
    color: #333;
    font-size: 12px;
    cursor: pointer;
    &.mute {
      width: 36px;
      padding: 0;
    }
  }
`;

type Props = {
  children: ReactNode;
};

// 状態はメモリ上にのみ持つので、ページ遷移では維持されリロードで元に戻る
export const DopamineModeProvider = ({ children }: Props): JSX.Element => {
  const [isDopamine, setIsDopamine] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // クリックの中から呼ばれる前提。音声の再生許可もここで取る
  const enable = useCallback(() => {
    unlock();
    if (!isMuted) playBurst();
    setIsDopamine(true);
  }, [isMuted]);
  const disable = useCallback(() => setIsDopamine(false), []);
  const toggleMute = useCallback(() => {
    unlock();
    setIsMuted((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({ isDopamine, isMuted, enable, disable, toggleMute }),
    [isDopamine, isMuted, enable, disable, toggleMute],
  );

  return (
    <DopamineModeContext.Provider value={value}>
      {children}
      {isDopamine && (
        <>
          <DopamineGlobalStyle />
          <RainbowBurst />
          <Controls
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onDisable={disable}
          />
        </>
      )}
    </DopamineModeContext.Provider>
  );
};

export const useDopamineMode = (): DopamineModeValue =>
  useContext(DopamineModeContext);
