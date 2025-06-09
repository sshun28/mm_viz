import React, { useEffect, useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useData, useSharedTrajectoryAnimation } from '../../providers/DataProvider';
import { FLOOR_THICKNESS } from '../../config/constants';

// TrajectoryPathのProps
interface TrajectoryPathProps {
  pastColor?: string;           // 過去の軌跡の色
  lineWidth?: number;           // 線の太さ
  height?: number;              // 床からの高さ
  segments?: number;            // 表示するセグメント数 (過去)
  opacity?: number;             // 透明度
  showLine?: boolean;           // 線表示の有効/無効
  showPoints?: boolean;         // 点表示の有効/無効
  pointSize?: number;           // 点のサイズ
  pointColor?: string;          // 点の色
}

/**
 * マウスの軌跡を表示するコンポーネント
 * 過去の軌跡を線と点で表示できます
 * useFrameを使用してThree.jsオブジェクトを直接操作し、パフォーマンスを向上
 */
const TrajectoryPath: React.FC<TrajectoryPathProps> = ({
  pastColor = '#00aaff',
  lineWidth = 2,
  height = 0.005,
  segments = 100,
  opacity = 0.7,
  showLine = true,
  showPoints = false,
  pointSize = 0.001,
  pointColor,
}) => {
  // DataProviderからデータを取得
  const trajectoryProfile = useData((state) => state.trajectoryProfile);
  const isPlaying = useData((state) => state.isPlaying);
  
  // 高性能アニメーション用のref管理（共有）
  const { currentTimeRef } = useSharedTrajectoryAnimation();
  
  // Three.jsのオブジェクト参照
  const rootRef = useRef<THREE.Group>(null);
  const pastLineRef = useRef<THREE.Line | null>(null);
  const pointsInstancedMeshRef = useRef<THREE.InstancedMesh | null>(null);
  
  // キャッシュとタイムスタンプの参照
  const lastTimeRef = useRef<number>(-1);
  const sortedTimesRef = useRef<number[]>([]);
  const maxPointsRef = useRef<number>(1000); // インスタンス化するポイントの最大数
  
  // 点の色を決定（pointColorが未指定の場合はpastColorを使用）
  const actualPointColor = pointColor || pastColor;
  
  // マテリアルを作成
  const pastMaterial = useMemo(() => new THREE.LineBasicMaterial({
    color: pastColor,
    linewidth: lineWidth,
    transparent: true,
    opacity: opacity,
  }), [pastColor, lineWidth, opacity]);
  
  // 点用のマテリアルを作成
  const pointMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: actualPointColor,
    transparent: true,
    opacity: opacity,
    side: THREE.DoubleSide, // 両面表示
    depthTest: true,
    depthWrite: true,
  }), [actualPointColor, opacity]);
  
  // 点用のジオメトリを作成（小さな球体）
  const pointGeometry = useMemo(() => new THREE.SphereGeometry(pointSize, 8, 6), [pointSize]);
  
  // コンポーネントのマウント時に必要なセットアップを行う
  useEffect(() => {
    if (!rootRef.current) return;
    
    // ソートされた時間キーの配列を作成してキャッシュ
    if (trajectoryProfile?.size > 0) {
      sortedTimesRef.current = Array.from(trajectoryProfile.keys()).sort((a, b) => a - b);
    }
    
    // 過去軌跡のラインを作成
    if (showLine) {
      const pastGeometry = new THREE.BufferGeometry();
      const pastLine = new THREE.Line(pastGeometry, pastMaterial);
      pastLineRef.current = pastLine;
      rootRef.current.add(pastLine);
    }
    
    // 点表示用のInstancedMeshを作成
    if (showPoints) {
      const pointsInstancedMesh = new THREE.InstancedMesh(pointGeometry, pointMaterial, maxPointsRef.current);
      pointsInstancedMesh.count = 0; // 初期状態では何も表示しない
      pointsInstancedMesh.visible = true;
      pointsInstancedMesh.castShadow = false;
      pointsInstancedMesh.receiveShadow = false;
      pointsInstancedMesh.frustumCulled = false; // カリングを無効にして確実に表示
      pointsInstancedMeshRef.current = pointsInstancedMesh;
      rootRef.current.add(pointsInstancedMesh);
    }
    
    // クリーンアップ
    return () => {
      if (rootRef.current) {
        if (pastLineRef.current) rootRef.current.remove(pastLineRef.current);
        if (pointsInstancedMeshRef.current) rootRef.current.remove(pointsInstancedMeshRef.current);
      }
    };
  }, [trajectoryProfile, pastMaterial, pointGeometry, pointMaterial, showLine, showPoints]);
  
  // 軌跡の色やスタイルが変更された場合に更新
  useEffect(() => {
    if (pastLineRef.current && pastLineRef.current.material) {
      (pastLineRef.current.material as THREE.LineBasicMaterial).color.set(pastColor);
      (pastLineRef.current.material as THREE.LineBasicMaterial).linewidth = lineWidth;
      (pastLineRef.current.material as THREE.LineBasicMaterial).opacity = opacity;
    }
    
    if (pointsInstancedMeshRef.current && pointsInstancedMeshRef.current.material) {
      (pointsInstancedMeshRef.current.material as THREE.MeshBasicMaterial).color.set(actualPointColor);
      (pointsInstancedMeshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
    }
  }, [pastColor, lineWidth, opacity, actualPointColor]);
  
  // 毎フレーム軌跡を更新
  useFrame(() => {
    // 必要なrefがない場合や、軌跡データがない場合は早期リターン
    if (!rootRef.current || !trajectoryProfile || trajectoryProfile.size === 0) {
      return;
    }
    
    // 線と点の両方が無効な場合は何もしない
    if (!showLine && !showPoints) {
      return;
    }
    
    const currentTime = currentTimeRef.current;
    
    // 時間が変わっていない場合は更新不要
    if (lastTimeRef.current === currentTime) {
      return;
    }
    
    lastTimeRef.current = currentTime;
    
    // ソートされた時間キーが未設定の場合は作成
    if (sortedTimesRef.current.length === 0) {
      sortedTimesRef.current = Array.from(trajectoryProfile.keys()).sort((a, b) => a - b);
    }
    
    const sortedTimes = sortedTimesRef.current;
    
    // 軌跡ポイントの計算
    const pastPoints = calculateTrajectoryPoints(
      trajectoryProfile,
      sortedTimes,
      currentTime,
      height,
      isPlaying
    );
    
    // 線の軌跡を更新
    if (showLine && pastLineRef.current) {
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
    }
    
    // 点の軌跡を更新
    if (showPoints && pointsInstancedMeshRef.current) {
      updatePointsDisplay(pastPoints, pointsInstancedMeshRef.current);
    }
  });
  
  // レンダリング - 空のグループを返すだけで、実際の処理はuseFrameが担当
  return <group ref={rootRef} />;
};

/**
 * InstancedMeshを使用して点の表示を更新する関数
 * パフォーマンスを考慮して、InstancedMeshのmatrixを直接更新
 */
function updatePointsDisplay(points: [number, number, number][], instancedMesh: THREE.InstancedMesh) {
  const maxInstances = 1000;
  const pointCount = Math.min(points.length, maxInstances);
  
  // ポイントが無い場合はInstancedMeshを非表示
  if (points.length === 0) {
    instancedMesh.count = 0;
    return;
  }
  
  // 各ポイントの位置を設定
  for (let i = 0; i < pointCount; i++) {
    const [x, y, z] = points[i];
    // 点の高さを線と同じにする（zをそのまま使用）
    
    // Matrix4を明示的に作成して位置を設定
    const matrix = new THREE.Matrix4();
    matrix.makeTranslation(x, y, z);
    
    instancedMesh.setMatrixAt(i, matrix);
  }
  
  // 表示するインスタンス数を設定
  instancedMesh.count = pointCount;
  instancedMesh.instanceMatrix.needsUpdate = true;
}

/**
 * 軌跡ポイントを計算する関数
 * useMemoの代わりに通常の関数として実装し、useFrame内で呼び出す
 */
function calculateTrajectoryPoints(
  trajectoryProfile: Map<number, any>,
  sortedTimes: number[],
  currentTime: number,
  height: number,
  isPlaying: boolean
): [number, number, number][] {
  // プロファイルが未定義または空の場合
  if (!trajectoryProfile || trajectoryProfile.size === 0 || sortedTimes.length === 0) {
    return [];
  }
  
  // 停止状態の場合は軌跡を表示しない
  if (!isPlaying && currentTime <= 0) {
    return [];
  }
  
  // 現在時刻が最初の時刻より前の場合は軌跡を表示しない
  if (currentTime < sortedTimes[0]) {
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
  
  return pastPointsArray;
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


export default React.memo(TrajectoryPath);