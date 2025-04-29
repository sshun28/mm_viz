import React from 'react';
import Mouse from './Mouse';
import { useTrajectory } from '../../providers/TrajectoryProvider';

/**
 * TrajectoryProviderと連携して動作するマウスコンポーネント
 * 軌跡データから現在のマウスの状態を取得して表示します
 */
const AnimatedMouse: React.FC = () => {
  // TrajectoryProviderから現在のマウス状態を取得
  const { currentMouseState } = useTrajectory();
  
  // マウスコンポーネントに現在の状態を渡す
  return <Mouse mouseState={currentMouseState} />;
};

export default AnimatedMouse;