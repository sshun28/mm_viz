import React, { useState, useEffect, useCallback } from 'react';
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

// スタイルはインラインで適用

interface PlaybackControlsProps {
  showTimeDisplay?: boolean;
  showSpeedControls?: boolean;
  showSeekBar?: boolean;
  controlPosition?: 'top' | 'bottom';
}

/**
 * 軌跡再生のコントロールUIコンポーネント
 * TrajectoryProviderのコンテキストを使用してアニメーションを制御
 * UIの更新だけに焦点を当て、内部状態はrefで管理
 */
const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  showTimeDisplay = true,
  showSpeedControls = true,
  showSeekBar = true,
  controlPosition = 'bottom',
}) => {
  // TrajectoryProviderのコンテキストを取得
  const {
    play,
    pause,
    stop,
    seekTo,
    setPlaybackSpeed,
    isPlayingRef,
    currentTimeRef,
    durationRef,
    playbackSpeedRef,
  } = useTrajectory();

  // UIの表示用の状態
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeedUi] = useState(1);

  // 再生/一時停止の切り替え
  const togglePlayPause = useCallback(() => {
    if (isPlayingRef.current) {
      pause();
      setIsPlaying(false);
    } else {
      play();
      setIsPlaying(true);
    }
  }, [play, pause, isPlayingRef]);

  // 再生停止
  const handleStop = useCallback(() => {
    stop();
    setIsPlaying(false);
    setCurrentTime(0);
  }, [stop]);

  // シークバーの変更
  const handleSeek = useCallback((value: number) => {
    seekTo(value);
    setCurrentTime(value);
  }, [seekTo]);

  // 再生速度の変更
  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    setPlaybackSpeedUi(speed);
  }, [setPlaybackSpeed]);

  // 時間のフォーマット
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const milliseconds = Math.floor((timeInSeconds - Math.floor(timeInSeconds)) * 100);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  // 速度のフォーマット
  const formatSpeed = (speed: number): string => {
    return `${speed.toFixed(1)}x`;
  };

  // 速度オプション
  const speedOptions = [0.25, 0.5, 1, 2, 4, 8];

  // 状態更新用のインターバル
  useEffect(() => {
    const intervalId = setInterval(() => {
      // ref から状態を読み取り、UI表示用の状態を更新
      setIsPlaying(isPlayingRef.current);
      setCurrentTime(currentTimeRef.current);
      setDuration(durationRef.current);
      setPlaybackSpeedUi(playbackSpeedRef.current);
    }, 50); // 50msごとに更新（60FPSより少し遅め）

    return () => clearInterval(intervalId);
  }, [isPlayingRef, currentTimeRef, durationRef, playbackSpeedRef]);

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
    </div>
  );
};

export default PlaybackControls;