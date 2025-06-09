import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useData, useSharedTrajectoryAnimation } from '../../providers/DataProvider';

/**
 * R3Fの`useFrame`を使って軌跡アニメーションを制御するコンポーネント
 * このコンポーネントはCanvasの中に配置する必要があります
 */
const TrajectoryAnimationController: React.FC = () => {
  // Zustandから制御状態のみを取得
  const isPlaying = useData((state) => state.isPlaying);
  const duration = useData((state) => state.duration);
  const playbackSpeed = useData((state) => state.playbackSpeed);
  const isLoopEnabled = useData((state) => state.isLoopEnabled);
  const trajectoryProfile = useData((state) => state.trajectoryProfile);
  const sortedTimestamps = useData((state) => state.sortedTimestamps);
  
  // 制御用の関数を取得
  const pause = useData((state) => state.pause);
  const setMouseState = useData((state) => state.setMouseState);
  
  // 高性能アニメーション用のref管理（共有）
  const {
    currentTimeRef,
    currentMouseStateRef,
    updateMouseStateForTime,
    setCurrentTime: setAnimationTime,
  } = useSharedTrajectoryAnimation();

  // 前回のフレーム時間を記録
  const lastTimeRef = useRef<number>(0);

  // 毎フレーム実行される処理
  useFrame((_state, delta) => {
    // 再生中でなければ何もしない
    if (!isPlaying) {
      lastTimeRef.current = 0;
      return;
    }

    // deltaの累積値が不安定になるのを防ぐ
    const cappedDelta = Math.min(delta, 0.1);
    
    // 前回のフレームからの経過時間を計算（最初のフレームは0）
    const timeSinceLastFrame = lastTimeRef.current === 0 ? 0 : cappedDelta;
    
    // 更新後の現在時間を計算
    const nextTime = currentTimeRef.current + timeSinceLastFrame * playbackSpeed;
    
    // 時間が終端を超えたら
    if (nextTime >= duration) {
      if (isLoopEnabled) {
        // ループが有効な場合は最初から再開
        setAnimationTime(0);
        updateMouseStateForTime(0, trajectoryProfile, sortedTimestamps);
      } else {
        // ループが無効な場合は最後の時間に設定して一時停止
        setAnimationTime(duration);
        updateMouseStateForTime(duration, trajectoryProfile, sortedTimestamps);
        pause(); // Zustandの状態を更新
      }
      lastTimeRef.current = 0;
      return;
    }
    
    // 現在時間を更新（refのみ、Zustandは更新しない）
    setAnimationTime(nextTime);
    
    // マウスの状態を更新（refのみ、Zustandは更新しない）
    updateMouseStateForTime(nextTime, trajectoryProfile, sortedTimestamps);
    
    // デバッグログ（低頻度）
    if (Math.random() < 0.01) {
      console.log('TrajectoryAnimationController: time=', nextTime, 'mouseState=', currentMouseStateRef.current);
    }
    
    // 今回のフレーム時間を記録
    lastTimeRef.current = cappedDelta;
  });

  // このコンポーネントは何もレンダリングしない
  return null;
};

export default TrajectoryAnimationController;