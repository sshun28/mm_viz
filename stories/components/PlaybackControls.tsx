import React from 'react';
import { usePlaybackControls } from '../../src/hooks/usePlaybackControls';

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
  topControlPanel: {
    top: '10px',
    bottom: 'auto',
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

interface PlaybackControlsProps {
  showTimeDisplay?: boolean;
  showSpeedControls?: boolean;
  showSeekBar?: boolean;
  showLoopControl?: boolean;
  controlPosition?: 'top' | 'bottom';
}

/**
 * 軌跡再生のコントロールUIコンポーネント（Storybook専用）
 * usePlaybackControlsフックを使用してheadless UIロジックを利用
 */
const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  showTimeDisplay = true,
  showSpeedControls = true,
  showSeekBar = true,
  showLoopControl = true,
  controlPosition = 'bottom',
}) => {
  const {
    isPlaying,
    currentTime,
    duration,
    playbackSpeed,
    isLoopEnabled,
    togglePlayPause,
    handleStop,
    handleSeek,
    handleSpeedChange,
    handleLoopToggle,
    formatTime,
    formatSpeed,
    speedOptions,
  } = usePlaybackControls();

  // コントロールパネルのスタイル
  const panelStyle = {
    ...styles.controlPanel,
    ...(controlPosition === 'top' ? styles.topControlPanel : {}),
  };

  return (
    <div style={panelStyle}>
      {/* 再生/一時停止ボタン */}
      <button
        onClick={togglePlayPause}
        style={styles.button}
      >
        {isPlaying ? '一時停止' : '再生'}
      </button>

      {/* 停止ボタン */}
      <button
        onClick={handleStop}
        style={styles.button}
      >
        停止
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
          onChange={(e) => handleSeek(parseFloat(e.target.value))}
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
              onClick={() => handleSpeedChange(speed)}
            >
              {formatSpeed(speed)}
            </button>
          ))}
        </div>
      )}

      {/* ループ制御 */}
      {showLoopControl && (
        <button
          onClick={handleLoopToggle}
          style={{
            ...styles.button,
            backgroundColor: isLoopEnabled ? '#4CAF50' : '#555',
          }}
        >
          🔁 {isLoopEnabled ? 'ON' : 'OFF'}
        </button>
      )}
    </div>
  );
};

export default PlaybackControls;