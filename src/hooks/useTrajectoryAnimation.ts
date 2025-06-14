import { useRef, useCallback } from 'react';
import { MouseState, TrajectoryProfile } from '../types';

/**
 * 高性能な軌道アニメーション用フック
 * 頻繁に更新される状態をrefベースで管理し、再レンダリングを防ぐ
 */
export const useTrajectoryAnimation = () => {
  // アニメーション中の高頻度更新状態をrefで管理
  const currentTimeRef = useRef<number>(0);
  const currentMouseStateRef = useRef<MouseState>({ position: { x: 0, y: 0 }, angle: 0 });

  // 現在の時間に対応するマウス状態を計算する関数
  const updateMouseStateForTime = useCallback((
    time: number,
    trajectoryProfile: TrajectoryProfile,
    sortedTimestamps: number[]
  ) => {
    // プロファイルが空の場合はデフォルト値
    if (sortedTimestamps.length === 0) {
      currentMouseStateRef.current = { position: { x: 0, y: 0 }, angle: 0 };
      return;
    }

    // 時間が最小値以下の場合は最初の状態
    if (time <= sortedTimestamps[0]) {
      const firstElement = trajectoryProfile.get(sortedTimestamps[0])!;
      currentMouseStateRef.current = {
        position: { ...firstElement.position },
        angle: firstElement.angle,
      };
      return;
    }

    // 時間が最大値以上の場合は最後の状態
    if (time >= sortedTimestamps[sortedTimestamps.length - 1]) {
      const lastElement = trajectoryProfile.get(sortedTimestamps[sortedTimestamps.length - 1])!;
      currentMouseStateRef.current = {
        position: { ...lastElement.position },
        angle: lastElement.angle,
      };
      return;
    }

    // 二分探索で現在の時刻を挟む前後のキーフレームを効率的に見つける
    const beforeIndex = binarySearchTimeIndex(sortedTimestamps, time);
    const beforeTime = sortedTimestamps[beforeIndex];
    const afterTime = sortedTimestamps[beforeIndex + 1];

    const beforeElement = trajectoryProfile.get(beforeTime)!;
    const afterElement = trajectoryProfile.get(afterTime)!;

    // 前後のキーフレーム間での位置の割合を計算
    const t = (time - beforeTime) / (afterTime - beforeTime);

    // 線形補間で現在の位置と角度を計算
    const interpolatedState = {
      position: {
        x: beforeElement.position.x + (afterElement.position.x - beforeElement.position.x) * t,
        y: beforeElement.position.y + (afterElement.position.y - beforeElement.position.y) * t,
      },
      angle: interpolateAngle(beforeElement.angle, afterElement.angle, t),
    };
    
    currentMouseStateRef.current = interpolatedState;
  }, []);

  // 時間を更新
  const setCurrentTime = useCallback((time: number) => {
    currentTimeRef.current = time;
  }, []);

  return {
    currentTimeRef,
    currentMouseStateRef,
    updateMouseStateForTime,
    setCurrentTime,
  };
};

/**
 * 二分探索で時間に対応するインデックスを検索する
 * 通常のforループよりも高速（O(log n)のアルゴリズム）
 */
function binarySearchTimeIndex(timestamps: number[], time: number): number {
  // timestamps配列内でtimeが入るべき位置を二分探索
  let left = 0;
  let right = timestamps.length - 1;

  // 端点のケース
  if (time <= timestamps[0]) return 0;
  if (time >= timestamps[right]) return right;

  // 二分探索
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (timestamps[mid] <= time && time < timestamps[mid + 1]) {
      return mid; // timeはtimestamps[mid]とtimestamps[mid+1]の間にある
    }

    if (timestamps[mid] < time) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  // 見つからない場合（通常はここに到達しない）
  return 0;
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