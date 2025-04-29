import React, { useState } from 'react';
import { useTrajectory } from '../../providers/TrajectoryProvider';

// CSS スタイル
const styles = {
  controlPanel: {
    position: 'absolute',
    bottom: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: '8px 16px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    color: 'white',
    fontFamily: 'Arial, sans-serif',
    zIndex: 100,
  },
  button: {
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s',
  },
  buttonHover: {
    backgroundColor: '#0d8bf2',
  },
  timeDisplay: {
    minWidth: '80px',
    fontSize: '14px',
    fontFamily: 'monospace',
    marginLeft: '8px',
  },
  slider: {
    width: '200px',
  },
  speedControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  speedLabel: {
    fontSize: '12px',
  },
  speedButton: {
    backgroundColor: '#555',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: '12px',
  },
} as const;

// スタイルはインラインで適用

interface PlaybackControlsProps {
  showTimeDisplay?: boolean;
  showSpeedControls?: boolean;
  showSeekBar?: boolean;
  controlPosition?: 'top' | 'bottom';
}

/**
 * 軌跡再生のコントロールUIコンポーネント
 * 再生・一時停止・停止ボタン、シークバー、タイム表示、再生速度調整を提供します
 */
const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  showTimeDisplay = true,
  showSpeedControls = true,
  showSeekBar = true,
  controlPosition = 'bottom',
}) => {
  // TrajectoryProviderから状態と制御関数を取得
  const {
    currentTime,
    isPlaying,
    duration,
    playbackSpeed,
    play,
    pause,
    stop,
    seekTo,
    setPlaybackSpeed,
  } = useTrajectory();

  // ホバー状態の管理
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  // フォーマット済みの時間表示
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    const ms = Math.floor((seconds % 1) * 100).toString().padStart(2, '0');
    return `${mins}:${secs}.${ms}`;
  };

  // 速度調整ボタン
  const speedOptions = [0.5, 1, 2, 5, 10];

  // 再生速度表示のフォーマット
  const formatSpeed = (speed: number) => {
    return speed === 1 ? '1x' : speed < 1 ? `${speed}x` : `${speed}x`;
  };

  // コントロールパネルの位置を調整
  const panelStyle = {
    ...styles.controlPanel,
    bottom: controlPosition === 'bottom' ? '10px' : undefined,
    top: controlPosition === 'top' ? '10px' : undefined,
  };

  return (
    <div style={panelStyle}>
      {/* 再生/一時停止ボタン */}
      <button
        style={{
          ...styles.button,
          ...(hoveredButton === 'playPause' ? styles.buttonHover : {}),
        }}
        onClick={isPlaying ? pause : play}
        onMouseEnter={() => setHoveredButton('playPause')}
        onMouseLeave={() => setHoveredButton(null)}
      >
        {isPlaying ? '⏸︎ 一時停止' : '▶️ 再生'}
      </button>

      {/* 停止ボタン */}
      <button
        style={{
          ...styles.button,
          ...(hoveredButton === 'stop' ? styles.buttonHover : {}),
        }}
        onClick={stop}
        onMouseEnter={() => setHoveredButton('stop')}
        onMouseLeave={() => setHoveredButton(null)}
      >
        ⏹︎ 停止
      </button>

      {/* 時間表示 */}
      {showTimeDisplay && (
        <div style={styles.timeDisplay}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      )}

      {/* シークバー */}
      {showSeekBar && (
        <input
          type="range"
          min={0}
          max={duration}
          step={0.01}
          value={currentTime}
          onChange={(e) => seekTo(parseFloat(e.target.value))}
          style={styles.slider}
        />
      )}

      {/* 速度調整 */}
      {showSpeedControls && (
        <div style={styles.speedControl}>
          <span style={styles.speedLabel}>速度: {formatSpeed(playbackSpeed)}</span>
          {speedOptions.map((speed) => (
            <button
              key={`speed-${speed}`}
              style={{
                ...styles.speedButton,
                fontWeight: playbackSpeed === speed ? 'bold' : 'normal',
                backgroundColor: playbackSpeed === speed ? '#2196F3' : '#555',
              }}
              onClick={() => setPlaybackSpeed(speed)}
            >
              {formatSpeed(speed)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaybackControls;