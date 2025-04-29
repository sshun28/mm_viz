import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { useTrajectory } from '../../providers/TrajectoryProvider';
import { FLOOR_THICKNESS } from '../../config/constants';

// TrajectoryPathのProps
interface TrajectoryPathProps {
  pastColor?: string;           // 過去の軌跡の色
  futureColor?: string;         // 将来の軌跡の色
  lineWidth?: number;           // 線の太さ
  showFutureTrajectory?: boolean; // 将来の軌跡を表示するかどうか
  height?: number;              // 床からの高さ
  segments?: number;            // 表示するセグメント数 (過去)
  futureSegments?: number;      // 表示するセグメント数 (将来)
  opacity?: number;             // 透明度
}

/**
 * マウスの軌跡を表示するコンポーネント
 * 過去の軌跡と将来の軌跡を区別して表示します
 */
const TrajectoryPath: React.FC<TrajectoryPathProps> = ({
  pastColor = '#00aaff',
  futureColor = '#aaaaaa',
  lineWidth = 2,
  showFutureTrajectory = false,
  height = 0.005,
  segments = 100,
  futureSegments = 50,
  opacity = 0.7,
}) => {
  // TrajectoryProviderからデータを取得
  const { 
    trajectoryProfile,
    currentTime
  } = useTrajectory();

  // 軌跡のポイントを計算
  const { pastPoints, futurePoints } = useMemo(() => {
    // プロファイルが未定義または空の場合
    if (!trajectoryProfile || trajectoryProfile.size === 0) {
      return { pastPoints: [], futurePoints: [] };
    }

    // 時間キーを昇順にソート
    const sortedTimes = Array.from(trajectoryProfile.keys()).sort((a, b) => a - b);
    
    // 過去の軌跡
    const pastPointsArray: [number, number, number][] = [];
    
    // 将来の軌跡
    const futurePointsArray: [number, number, number][] = [];
    
    // 過去の軌跡（現在時刻までの軌跡）
    let pastCount = 0;
    for (let i = 0; i < sortedTimes.length; i++) {
      const time = sortedTimes[i];
      
      // 現在時刻を超えたら終了
      if (time > currentTime) break;
      
      // セグメント数の制限
      if (pastCount >= segments) break;
      
      const element = trajectoryProfile.get(time);
      if (element) {
        // 座標と高さを設定
        pastPointsArray.push([
          element.position.x, 
          element.position.y, 
          FLOOR_THICKNESS / 2 + height
        ]);
        pastCount++;
      }
    }
    
    // 将来の軌跡（現在時刻以降の軌跡）
    if (showFutureTrajectory) {
      let futureCount = 0;
      for (let i = 0; i < sortedTimes.length; i++) {
        const time = sortedTimes[i];
        
        // 現在時刻より過去はスキップ
        if (time <= currentTime) continue;
        
        // セグメント数の制限
        if (futureCount >= futureSegments) break;
        
        const element = trajectoryProfile.get(time);
        if (element) {
          // 座標と高さを設定
          futurePointsArray.push([
            element.position.x, 
            element.position.y, 
            FLOOR_THICKNESS / 2 + height
          ]);
          futureCount++;
        }
      }
    }
    
    return { pastPoints: pastPointsArray, futurePoints: futurePointsArray };
  }, [trajectoryProfile, currentTime, segments, futureSegments, showFutureTrajectory, height]);

  // 軌跡が空の場合は何も描画しない
  if (pastPoints.length === 0 && futurePoints.length === 0) {
    return null;
  }

  return (
    <>
      {/* 過去の軌跡 */}
      {pastPoints.length > 1 && (
        <Line
          points={pastPoints}
          color={pastColor}
          lineWidth={lineWidth}
          opacity={opacity}
          transparent
        />
      )}
      
      {/* 将来の軌跡 */}
      {showFutureTrajectory && futurePoints.length > 1 && (
        <Line
          points={futurePoints}
          color={futureColor}
          lineWidth={lineWidth - 0.5} // 将来の軌跡は少し細めに
          opacity={opacity * 0.7}     // 将来の軌跡は少し透明に
          transparent
          dashed
          dashSize={0.05}
          gapSize={0.05}
        />
      )}
    </>
  );
};

export default TrajectoryPath;