import { useState, useEffect, useCallback } from 'react';
import { useData, useSharedTrajectoryAnimation } from '../providers/DataProvider';

/**
 * 軌跡再生コントロールのためのheadless hook
 * UIロジックと状態管理を提供し、実際のUIコンポーネントは別途実装
 */
export const usePlaybackControls = () => {
  // DataProviderから軌道制御関数と状態を取得
  const play = useData((state) => state.play);
  const pause = useData((state) => state.pause);
  const stop = useData((state) => state.stop);
  const setPlaybackSpeed = useData((state) => state.setPlaybackSpeed);
  const setLoopEnabled = useData((state) => state.setLoopEnabled);
  
  // 現在の状態を取得
  const isPlayingCurrent = useData((state) => state.isPlaying);
  const durationCurrent = useData((state) => state.duration);
  const playbackSpeedCurrent = useData((state) => state.playbackSpeed);
  const isLoopEnabledCurrent = useData((state) => state.isLoopEnabled);
  const sortedTimestampsCurrent = useData((state) => state.sortedTimestamps);
  const trajectoryProfile = useData((state) => state.trajectoryProfile);
  
  // 高性能アニメーション用のref管理（共有）
  const { currentTimeRef, updateMouseStateForTime, setCurrentTime: setAnimationTime } = useSharedTrajectoryAnimation();

  // UIの表示用の状態
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeedUi] = useState(1);
  const [isLoopEnabled, setIsLoopEnabledUi] = useState(false);
  const [firstTimestamp, setFirstTimestamp] = useState<number | null>(null);
  const [lastTimestamp, setLastTimestamp] = useState<number | null>(null);

  // 再生/一時停止の切り替え
  const togglePlayPause = useCallback(() => {
    if (isPlayingCurrent) {
      pause();
      setIsPlaying(false);
    } else {
      play();
      setIsPlaying(true);
    }
  }, [play, pause, isPlayingCurrent]);

  // 再生停止
  const handleStop = useCallback(() => {
    stop();
    setIsPlaying(false);
    setCurrentTime(0);
  }, [stop]);

  // シークバーの変更（デフォルトで一時停止）
  const handleSeek = useCallback((value: number, pauseAfterSeek: boolean = true) => {
    // refベースのアニメーションシステムを更新
    setAnimationTime(value);
    updateMouseStateForTime(value, trajectoryProfile, sortedTimestampsCurrent);
    
    // 一時停止が指定されている場合は停止
    if (pauseAfterSeek) {
      pause();
    }
  }, [setAnimationTime, updateMouseStateForTime, trajectoryProfile, sortedTimestampsCurrent, pause]);

  // 再生速度の変更
  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    setPlaybackSpeedUi(speed);
  }, [setPlaybackSpeed]);

  // ループ設定の変更
  const handleLoopToggle = useCallback(() => {
    const newLoopState = !isLoopEnabledCurrent;
    setLoopEnabled(newLoopState);
    setIsLoopEnabledUi(newLoopState);
  }, [setLoopEnabled, isLoopEnabledCurrent]);

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

  // 状態更新用のeffect（Zustandの状態とrefの状態を同期）
  useEffect(() => {
    setIsPlaying(isPlayingCurrent);
    setDuration(durationCurrent);
    setPlaybackSpeedUi(playbackSpeedCurrent);
    setIsLoopEnabledUi(isLoopEnabledCurrent);
    
    // タイムスタンプの最初と最後を更新
    if (sortedTimestampsCurrent && sortedTimestampsCurrent.length > 0) {
      setFirstTimestamp(sortedTimestampsCurrent[0]);
      setLastTimestamp(sortedTimestampsCurrent[sortedTimestampsCurrent.length - 1]);
    } else {
      setFirstTimestamp(null);
      setLastTimestamp(null);
    }
  }, [isPlayingCurrent, durationCurrent, playbackSpeedCurrent, isLoopEnabledCurrent, sortedTimestampsCurrent]);

  // UI表示用のcurrentTimeを定期的にrefから同期
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(currentTimeRef.current);
    }, 50); // 50msごとに更新（20FPS）

    return () => clearInterval(intervalId);
  }, [currentTimeRef]);

  return {
    // 状態
    isPlaying,
    currentTime,
    duration,
    playbackSpeed,
    isLoopEnabled,
    firstTimestamp,
    lastTimestamp,
    
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