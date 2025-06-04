import React from 'react';
import { useFrame } from '@react-three/fiber';
import { useTrajectory } from '../../providers/TrajectoryProvider';

/**
 * R3Fの`useFrame`を使って軌跡アニメーションを制御するコンポーネント
 * このコンポーネントはCanvasの中に配置する必要があります
 */
const TrajectoryAnimationController: React.FC = () => {
  const {
    isPlayingRef,
    currentTimeRef,
    durationRef,
    playbackSpeedRef,
    isLoopEnabledRef,
    updateMouseStateForTime
  } = useTrajectory();

  // 前回のフレーム時間を記録
  const lastTimeRef = React.useRef<number>(0);

  // 毎フレーム実行される処理
  useFrame((_state, delta) => {
    // 再生中でなければ何もしない
    if (!isPlayingRef.current) {
      lastTimeRef.current = 0;
      return;
    }

    // deltaの累積値が不安定になるのを防ぐ
    const cappedDelta = Math.min(delta, 0.1);
    
    // 前回のフレームからの経過時間を計算（最初のフレームは0）
    const timeSinceLastFrame = lastTimeRef.current === 0 ? 0 : cappedDelta;
    
    // 更新後の現在時間を計算
    const nextTime = currentTimeRef.current + timeSinceLastFrame * playbackSpeedRef.current;
    
    // 時間が終端を超えたら
    if (nextTime >= durationRef.current) {
      if (isLoopEnabledRef.current) {
        // ループが有効な場合は最初から再開
        currentTimeRef.current = 0;
        updateMouseStateForTime(0);
      } else {
        // ループが無効な場合は最後の時間に設定して一時停止
        currentTimeRef.current = durationRef.current;
        isPlayingRef.current = false;
        updateMouseStateForTime(durationRef.current);
      }
      lastTimeRef.current = 0;
      return;
    }
    
    // 現在時間を更新
    currentTimeRef.current = nextTime;
    
    // マウスの状態を更新
    updateMouseStateForTime(nextTime);
    
    // 今回のフレーム時間を記録
    lastTimeRef.current = cappedDelta;
  });

  // このコンポーネントは何もレンダリングしない
  return null;
};

export default TrajectoryAnimationController;