import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { MouseState, TrajectoryProfile, TrajectoryElement } from '../types';

// TrajectoryContextの型定義
interface TrajectoryContextType {
  // 現在の状態
  currentMouseState: MouseState;
  currentTime: number;
  isPlaying: boolean;
  duration: number;
  playbackSpeed: number;

  // 制御関数
  play: () => void;
  pause: () => void;
  stop: () => void;
  seekTo: (time: number) => void;
  setPlaybackSpeed: (speed: number) => void;
}

// デフォルト値の設定
const defaultContext: TrajectoryContextType = {
  currentMouseState: { position: { x: 0, y: 0 }, angle: 0 },
  currentTime: 0,
  isPlaying: false,
  duration: 0,
  playbackSpeed: 1,
  play: () => {},
  pause: () => {},
  stop: () => {},
  seekTo: () => {},
  setPlaybackSpeed: () => {},
};

// コンテキストの作成
const TrajectoryContext = createContext<TrajectoryContextType>(defaultContext);

// TrajectoryProviderのProps
interface TrajectoryProviderProps {
  trajectoryProfile: TrajectoryProfile;
  initialTime?: number;
  initialSpeed?: number;
  children: React.ReactNode;
}

/**
 * 軌跡データと再生状態を管理するコンテキストプロバイダー
 * マウスの動きを時間に基づいて制御するための機能を提供します
 */
export const TrajectoryProvider: React.FC<TrajectoryProviderProps> = ({
  trajectoryProfile,
  initialTime = 0,
  initialSpeed = 1,
  children,
}) => {
  // 時間関連の状態
  const [currentTime, setCurrentTime] = useState<number>(initialTime);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(initialSpeed);
  
  // アニメーションフレーム管理用
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  
  // プロファイルから時間の範囲を計算
  const timestamps = useSortedTimestamps(trajectoryProfile);
  const duration = timestamps.length > 0 ? timestamps[timestamps.length - 1] : 0;

  // 現在のマウス状態を計算
  const currentMouseState = useInterpolatedMouseState(trajectoryProfile, currentTime);

  // 再生開始
  const play = useCallback(() => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    lastTimeRef.current = performance.now();
    
    // 最後まで到達していたら最初から再生
    if (currentTime >= duration) {
      setCurrentTime(0);
    }
  }, [isPlaying, currentTime, duration]);
  
  // 一時停止
  const pause = useCallback(() => {
    setIsPlaying(false);
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);
  
  // 停止（最初に戻る）
  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);
  
  // 指定時間にシーク
  const seekTo = useCallback((time: number) => {
    setCurrentTime(Math.max(0, Math.min(time, duration)));
  }, [duration]);
  
  // 再生速度の設定
  const setSpeed = useCallback((speed: number) => {
    setPlaybackSpeed(Math.max(0.1, Math.min(10, speed)));
  }, []);
  
  // アニメーションループ
  useEffect(() => {
    if (!isPlaying) return;
    
    const animate = (now: number) => {
      const deltaTime = (now - lastTimeRef.current) / 1000; // 秒単位に変換
      lastTimeRef.current = now;
      
      // 現在の時間を更新
      setCurrentTime((prevTime) => {
        const newTime = prevTime + deltaTime * playbackSpeed;
        
        // 再生が終わったら停止または最初に戻る
        if (newTime >= duration) {
          return 0; // ループ再生として最初に戻る
        }
        
        return newTime;
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    // クリーンアップ
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, duration]);
  
  // コンテキスト値の設定
  const contextValue: TrajectoryContextType = {
    currentMouseState,
    currentTime,
    isPlaying,
    duration,
    playbackSpeed,
    play,
    pause,
    stop,
    seekTo,
    setPlaybackSpeed: setSpeed,
  };
  
  return (
    <TrajectoryContext.Provider value={contextValue}>
      {children}
    </TrajectoryContext.Provider>
  );
};

/**
 * TrajectoryProviderのコンテキスト値にアクセスするためのカスタムフック
 * このフックはTrajectoryProviderがツリーの上位に存在する場合にのみ使用できます
 */
export const useTrajectory = (): TrajectoryContextType => {
  const context = useContext(TrajectoryContext);
  
  if (context === undefined) {
    throw new Error('useTrajectory must be used within a TrajectoryProvider');
  }
  
  return context;
};

/**
 * TrajectoryProfileの時刻キーをソートして配列として返す
 */
function useSortedTimestamps(trajectoryProfile: TrajectoryProfile): number[] {
  return React.useMemo(() => {
    return Array.from(trajectoryProfile.keys()).sort((a, b) => a - b);
  }, [trajectoryProfile]);
}

/**
 * 現在の時刻に対応するMouseStateを計算する
 * 指定した時刻の前後のキーフレーム間を線形補間して滑らかな動きを実現
 */
function useInterpolatedMouseState(
  trajectoryProfile: TrajectoryProfile,
  currentTime: number
): MouseState {
  return React.useMemo(() => {
    const timestamps = Array.from(trajectoryProfile.keys()).sort((a, b) => a - b);
    
    // プロファイルが空の場合はデフォルト値を返す
    if (timestamps.length === 0) {
      return { position: { x: 0, y: 0 }, angle: 0 };
    }
    
    // 時間が最小値以下の場合は最初の状態を返す
    if (currentTime <= timestamps[0]) {
      const firstElement = trajectoryProfile.get(timestamps[0])!;
      return {
        position: { ...firstElement.position },
        angle: firstElement.angle,
      };
    }
    
    // 時間が最大値以上の場合は最後の状態を返す
    if (currentTime >= timestamps[timestamps.length - 1]) {
      const lastElement = trajectoryProfile.get(timestamps[timestamps.length - 1])!;
      return {
        position: { ...lastElement.position },
        angle: lastElement.angle,
      };
    }
    
    // 現在の時刻を挟む前後のキーフレームを見つける
    let beforeIndex = 0;
    for (let i = 0; i < timestamps.length - 1; i++) {
      if (timestamps[i] <= currentTime && currentTime < timestamps[i + 1]) {
        beforeIndex = i;
        break;
      }
    }
    
    const beforeTime = timestamps[beforeIndex];
    const afterTime = timestamps[beforeIndex + 1];
    
    const beforeElement = trajectoryProfile.get(beforeTime)!;
    const afterElement = trajectoryProfile.get(afterTime)!;
    
    // 前後のキーフレーム間での位置の割合を計算
    const t = (currentTime - beforeTime) / (afterTime - beforeTime);
    
    // 線形補間で現在の位置と角度を計算
    return {
      position: {
        x: beforeElement.position.x + (afterElement.position.x - beforeElement.position.x) * t,
        y: beforeElement.position.y + (afterElement.position.y - beforeElement.position.y) * t,
      },
      angle: interpolateAngle(beforeElement.angle, afterElement.angle, t),
    };
  }, [trajectoryProfile, currentTime]);
}

/**
 * 角度を線形補間する関数
 * 角度は-πからπの範囲にあるため、最短経路で補間する
 */
function interpolateAngle(a1: number, a2: number, t: number): number {
  // 角度の差を-πからπの範囲に正規化
  let diff = ((a2 - a1 + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  
  // 補間した角度を-πからπの範囲に正規化
  return ((a1 + diff * t + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
}