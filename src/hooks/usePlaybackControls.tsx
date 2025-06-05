import { useState, useEffect, useCallback } from 'react';
import { useTrajectory } from '../providers/TrajectoryProvider';

/**
 * 軌跡再生コントロールのためのheadless hook
 * UIロジックと状態管理を提供し、実際のUIコンポーネントは別途実装
 */
export const usePlaybackControls = () => {
  // TrajectoryProviderのコンテキストを取得
  const {
    play,
    pause,
    stop,
    seekTo,
    setPlaybackSpeed,
    setLoopEnabled,
    isPlayingRef,
    currentTimeRef,
    durationRef,
    playbackSpeedRef,
    isLoopEnabledRef,
  } = useTrajectory();

  // UIの表示用の状態
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeedUi] = useState(1);
  const [isLoopEnabled, setIsLoopEnabledUi] = useState(false);

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

  // シークバーの変更（デフォルトで一時停止）
  const handleSeek = useCallback((value: number, pauseAfterSeek: boolean = true) => {
    seekTo(value, pauseAfterSeek);
    setCurrentTime(value);
  }, [seekTo]);

  // 再生速度の変更
  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    setPlaybackSpeedUi(speed);
  }, [setPlaybackSpeed]);

  // ループ設定の変更
  const handleLoopToggle = useCallback(() => {
    const newLoopState = !isLoopEnabledRef.current;
    setLoopEnabled(newLoopState);
    setIsLoopEnabledUi(newLoopState);
  }, [setLoopEnabled, isLoopEnabledRef]);

  // 時間のフォーマット
  const formatTime = useCallback((timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const milliseconds = Math.floor((timeInSeconds - Math.floor(timeInSeconds)) * 100);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  }, []);

  // 速度のフォーマット
  const formatSpeed = useCallback((speed: number): string => {
    return `${speed.toFixed(1)}x`;
  }, []);

  // 状態更新用のインターバル
  useEffect(() => {
    const intervalId = setInterval(() => {
      // ref から状態を読み取り、UI表示用の状態を更新
      setIsPlaying(isPlayingRef.current);
      setCurrentTime(currentTimeRef.current);
      setDuration(durationRef.current);
      setPlaybackSpeedUi(playbackSpeedRef.current);
      setIsLoopEnabledUi(isLoopEnabledRef.current);
    }, 50); // 50msごとに更新（60FPSより少し遅め）

    return () => clearInterval(intervalId);
  }, [isPlayingRef, currentTimeRef, durationRef, playbackSpeedRef, isLoopEnabledRef]);

  return {
    // 状態
    isPlaying,
    currentTime,
    duration,
    playbackSpeed,
    isLoopEnabled,
    
    // アクション
    togglePlayPause,
    handleStop,
    handleSeek,
    handleSpeedChange,
    handleLoopToggle,
    
    // ユーティリティ
    formatTime,
    formatSpeed,
    
    // 定数
    speedOptions: [0.25, 0.5, 1, 2, 4, 8] as const,
  };
};

export default usePlaybackControls;