import React, { useEffect, useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useTrajectory } from '../../providers/TrajectoryProvider';
import { FLOOR_THICKNESS } from '../../config/constants';

// TrajectoryPathのProps
interface TrajectoryPathProps {
  pastColor?: string;           // 過去の軌跡の色
  lineWidth?: number;           // 線の太さ
  height?: number;              // 床からの高さ
  segments?: number;            // 表示するセグメント数 (過去)
  opacity?: number;             // 透明度
  simplifyTolerance?: number;   // ポイント間引きの許容誤差
}

/**
 * マウスの軌跡を表示するコンポーネント
 * 過去の軌跡を実線で表示します
 * useFrameを使用してThree.jsオブジェクトを直接操作し、パフォーマンスを向上
 */
const TrajectoryPath: React.FC<TrajectoryPathProps> = ({
  pastColor = '#00aaff',
  lineWidth = 2,
  height = 0.005,
  segments = 100,
  opacity = 0.7,
  simplifyTolerance = 0.01, // ポイント間引きの許容誤差（小さいほど高精度、大きいほど軽量）
}) => {
  // TrajectoryProviderからデータを取得
  const trajectory = useTrajectory();
  const { scene } = useThree();
  
  // Three.jsのオブジェクト参照
  const rootRef = useRef<THREE.Group>(null);
  const pastLineRef = useRef<THREE.Line | null>(null);
  
  // キャッシュとタイムスタンプの参照
  const lastTimeRef = useRef<number>(-1);
  const sortedTimesRef = useRef<number[]>([]);
  
  // マテリアルを作成
  const pastMaterial = useMemo(() => new THREE.LineBasicMaterial({
    color: pastColor,
    linewidth: lineWidth,
    transparent: true,
    opacity: opacity,
  }), [pastColor, lineWidth, opacity]);
  
  // コンポーネントのマウント時に必要なセットアップを行う
  useEffect(() => {
    if (!rootRef.current) return;
    
    // ソートされた時間キーの配列を作成してキャッシュ
    if (trajectory.trajectoryProfileRef.current?.size > 0) {
      sortedTimesRef.current = Array.from(trajectory.trajectoryProfileRef.current?.keys()).sort((a, b) => a - b);
    }
    
    // 過去軌跡のラインを作成
    const pastGeometry = new THREE.BufferGeometry();
    const pastLine = new THREE.Line(pastGeometry, pastMaterial);
    pastLineRef.current = pastLine;
    
    // シーンに追加
    rootRef.current.add(pastLine);
    
    // クリーンアップ
    return () => {
      if (rootRef.current) {
        if (pastLineRef.current) rootRef.current.remove(pastLineRef.current);
      }
    };
  }, [trajectory.trajectoryProfileRef, pastMaterial]);
  
  // 軌跡の色やスタイルが変更された場合に更新
  useEffect(() => {
    if (pastLineRef.current && pastLineRef.current.material) {
      (pastLineRef.current.material as THREE.LineBasicMaterial).color.set(pastColor);
      (pastLineRef.current.material as THREE.LineBasicMaterial).linewidth = lineWidth;
      (pastLineRef.current.material as THREE.LineBasicMaterial).opacity = opacity;
    }
  }, [pastColor, lineWidth, opacity]);
  
  // 毎フレーム軌跡を更新
  useFrame(() => {
    // 必要なrefがない場合や、軌跡データがない場合は早期リターン
    if (!rootRef.current || !pastLineRef.current || !trajectory.trajectoryProfileRef || trajectory.trajectoryProfileRef.current.size === 0) {
      return;
    }
    
    const currentTime = trajectory.currentTimeRef.current;
    
    // 時間が変わっていない場合は更新不要
    if (lastTimeRef.current === currentTime) {
      return;
    }
    
    lastTimeRef.current = currentTime;
    
    // ソートされた時間キーが未設定の場合は作成
    if (sortedTimesRef.current.length === 0) {
      sortedTimesRef.current = Array.from(trajectory.trajectoryProfileRef.current.keys()).sort((a, b) => a - b);
    }
    
    const sortedTimes = sortedTimesRef.current;
    
    // 軌跡ポイントの計算
    const pastPoints = calculateTrajectoryPoints(
      trajectory.trajectoryProfileRef.current,
      sortedTimes,
      currentTime,
      segments,
      height,
      simplifyTolerance
    );
    
    // 過去軌跡の更新
    const pastGeometry = pastLineRef.current.geometry;
    if (pastPoints.length > 1) {
      const pastPositions = new Float32Array(pastPoints.flat());
      pastGeometry.setAttribute('position', new THREE.BufferAttribute(pastPositions, 3));
      pastGeometry.computeBoundingSphere();
      pastGeometry.attributes.position.needsUpdate = true;
    } else {
      // ポイントが1個以下の場合はgeometryをクリア
      pastGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([]), 3));
      pastGeometry.attributes.position.needsUpdate = true;
    }
  });
  
  // レンダリング - 空のグループを返すだけで、実際の処理はuseFrameが担当
  return <group ref={rootRef} />;
};

/**
 * 軌跡ポイントを計算する関数
 * useMemoの代わりに通常の関数として実装し、useFrame内で呼び出す
 */
function calculateTrajectoryPoints(
  trajectoryProfile: Map<number, any>,
  sortedTimes: number[],
  currentTime: number,
  segments: number,
  height: number,
  simplifyTolerance: number
): [number, number, number][] {
  // プロファイルが未定義または空の場合
  if (!trajectoryProfile || trajectoryProfile.size === 0 || sortedTimes.length === 0) {
    return [];
  }
  
  // 現在時刻が最初の時刻以下の場合は軌跡を表示しない（停止時のリセット対応）
  if (currentTime <= sortedTimes[0]) {
    return [];
  }
  
  // 過去の軌跡
  const pastPointsArray: [number, number, number][] = [];
  
  // 二分探索で現在時刻のインデックスを検索
  let currentIndex = binarySearchTimeIndex(sortedTimes, currentTime);
  
  // 過去の軌跡の計算（現在時刻まで全て表示）
  // segmentsによる制限を撤廃し、開始から現在時刻まで全ての軌跡を表示
  const pastStartIndex = 0; // 最初から
  
  for (let i = pastStartIndex; i <= currentIndex; i++) {
    const time = sortedTimes[i];
    const element = trajectoryProfile.get(time);
    if (element) {
      pastPointsArray.push([
        element.position.x, 
        element.position.y, 
        FLOOR_THICKNESS / 2 + height
      ]);
    }
  }
  
  // 形状の単純化（ポリゴン削減によるパフォーマンス向上）
  const simplifiedPastPoints = simplifyPoints(pastPointsArray, simplifyTolerance);
  
  return simplifiedPastPoints;
}

/**
 * 二分探索で時間に対応するインデックスを検索する
 * O(log n)の計算量で効率的に探索
 */
function binarySearchTimeIndex(timestamps: number[], time: number): number {
  let left = 0;
  let right = timestamps.length - 1;
  
  // 端点のケース
  if (time <= timestamps[0]) return 0;
  if (time >= timestamps[right]) return right;
  
  // 二分探索
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    
    if (timestamps[mid] <= time && (mid === timestamps.length - 1 || time < timestamps[mid + 1])) {
      return mid;
    }
    
    if (timestamps[mid] < time) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return 0;
}

/**
 * ダグラス・ポイカー法を使用してポイント列を単純化
 * 許容誤差内で冗長なポイントを削除し、パフォーマンスを向上
 */
function simplifyPoints(
  points: [number, number, number][],
  tolerance: number
): [number, number, number][] {
  if (points.length <= 2) return points;
  
  // 単純化の必要がないほど少ない点数の場合はそのまま返す
  if (points.length <= 10) return points;
  
  const result: [number, number, number][] = [];
  
  // 最初と最後の点は常に保持
  result.push(points[0]);
  
  // 中間点を許容誤差に基づいて取捨選択
  let lastAddedPoint = points[0];
  
  for (let i = 1; i < points.length - 1; i++) {
    const current = points[i];
    const dx = current[0] - lastAddedPoint[0];
    const dy = current[1] - lastAddedPoint[1];
    const distSquared = dx * dx + dy * dy;
    
    // 前回追加した点から十分離れている場合のみ追加
    if (distSquared > tolerance * tolerance) {
      result.push(current);
      lastAddedPoint = current;
    }
  }
  
  // 最後の点を追加
  if (points.length > 1) {
    result.push(points[points.length - 1]);
  }
  
  return result;
}

export default React.memo(TrajectoryPath);