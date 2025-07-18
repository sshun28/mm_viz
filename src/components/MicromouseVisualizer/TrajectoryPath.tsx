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
  const bufferSizeRef = useRef<number>(0); // 現在のバッファサイズを追跡
  const maxBufferSize = 10000; // 最大バッファサイズ（頂点数）
  
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
      
      // バッファを事前に割り当て
      const initialSize = Math.min(
        trajectoryProfile?.size || 100, 
        maxBufferSize
      );
      const positions = new Float32Array(initialSize * 3);
      const positionAttribute = new THREE.BufferAttribute(positions, 3);
      positionAttribute.setUsage(THREE.DynamicDrawUsage);
      pastGeometry.setAttribute('position', positionAttribute);
      pastGeometry.setDrawRange(0, 0); // 初期状態では何も描画しない
      
      bufferSizeRef.current = initialSize;
      
      const pastLine = new THREE.Line(pastGeometry, pastMaterial);
      pastLineRef.current = pastLine;
      rootRef.current.add(pastLine);
    }
    
    // 点表示用のInstancedMeshを作成
    if (showPoints) {
      // 軌道データのサイズに基づいて適切な最大インスタンス数を計算
      const estimatedMaxPoints = trajectoryProfile?.size || 1000;
      const actualMaxPoints = Math.min(estimatedMaxPoints, maxPointsRef.current);
      
      const pointsInstancedMesh = new THREE.InstancedMesh(pointGeometry, pointMaterial, actualMaxPoints);
      pointsInstancedMesh.count = 0; // 初期状態では何も表示しない
      pointsInstancedMesh.visible = true;
      pointsInstancedMesh.castShadow = false;
      pointsInstancedMesh.receiveShadow = false;
      pointsInstancedMesh.frustumCulled = false; // カリングを無効にして確実に表示
      
      // デバッグ情報を出力（開発環境のみ）
      if (process.env.NODE_ENV === 'development') {
        console.debug(`TrajectoryPath: Created InstancedMesh with ${actualMaxPoints} max instances for ${estimatedMaxPoints} trajectory points`);
      }
      
      pointsInstancedMeshRef.current = pointsInstancedMesh;
      rootRef.current.add(pointsInstancedMesh);
    }
    
    // クリーンアップ
    return () => {
      if (rootRef.current) {
        if (pastLineRef.current) {
          rootRef.current.remove(pastLineRef.current);
          pastLineRef.current.geometry.dispose();
          pastLineRef.current = null;
        }
        if (pointsInstancedMeshRef.current) {
          rootRef.current.remove(pointsInstancedMeshRef.current);
          pointsInstancedMeshRef.current.geometry.dispose();
          pointsInstancedMeshRef.current = null;
        }
      }
      bufferSizeRef.current = 0;
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
  
  // TrajectoryProfileが変更された場合にバッファをリセット
  useEffect(() => {
    if (!rootRef.current || !trajectoryProfile) return;
    
    // 線のバッファを更新
    if (showLine && pastLineRef.current) {
      const geometry = pastLineRef.current.geometry;
      const expectedSize = trajectoryProfile.size;
      
      // 新しい軌跡が現在のバッファサイズの50%未満の場合、バッファを縮小
      // または新しい軌跡が現在のバッファより大きい場合、バッファを拡張
      if (expectedSize < bufferSizeRef.current * 0.5 || expectedSize > bufferSizeRef.current) {
        const newSize = Math.min(
          Math.max(expectedSize * 2, 100), // 最小100頂点
          maxBufferSize
        );
        
        const positions = new Float32Array(newSize * 3);
        const positionAttribute = new THREE.BufferAttribute(positions, 3);
        positionAttribute.setUsage(THREE.DynamicDrawUsage);
        geometry.setAttribute('position', positionAttribute);
        geometry.setDrawRange(0, 0);
        bufferSizeRef.current = newSize;
      }
      
      // タイムスタンプのキャッシュをリセット
      sortedTimesRef.current = Array.from(trajectoryProfile.keys()).sort((a, b) => a - b);
      lastTimeRef.current = -1;
    }
    
    // InstancedMeshの再作成チェック
    if (showPoints && pointsInstancedMeshRef.current) {
      const currentMaxInstances = pointsInstancedMeshRef.current.instanceMatrix.count;
      const requiredInstances = trajectoryProfile.size;
      
      // 必要なインスタンス数が現在の最大値を大幅に超える場合、InstancedMeshを再作成
      if (requiredInstances > currentMaxInstances) {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`TrajectoryPath: Recreating InstancedMesh: ${currentMaxInstances} -> ${requiredInstances} instances`);
        }
        
        // 古いInstancedMeshを削除
        rootRef.current.remove(pointsInstancedMeshRef.current);
        pointsInstancedMeshRef.current.geometry.dispose();
        
        // 新しいInstancedMeshを作成
        const newMaxInstances = Math.min(requiredInstances, maxPointsRef.current);
        const newPointsInstancedMesh = new THREE.InstancedMesh(pointGeometry, pointMaterial, newMaxInstances);
        newPointsInstancedMesh.count = 0;
        newPointsInstancedMesh.visible = true;
        newPointsInstancedMesh.castShadow = false;
        newPointsInstancedMesh.receiveShadow = false;
        newPointsInstancedMesh.frustumCulled = false;
        
        pointsInstancedMeshRef.current = newPointsInstancedMesh;
        rootRef.current.add(newPointsInstancedMesh);
      }
    }
  }, [trajectoryProfile, showLine, showPoints, pointGeometry, pointMaterial]);
  
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
      const positionAttribute = pastGeometry.getAttribute('position') as THREE.BufferAttribute;
      
      if (pastPoints.length > 1) {
        // バッファサイズをチェックし、必要に応じて再作成
        if (pastPoints.length > bufferSizeRef.current) {
          // 新しいサイズを計算（余裕を持たせる）
          const newSize = Math.min(
            Math.max(pastPoints.length * 2, bufferSizeRef.current * 2),
            maxBufferSize
          );
          
          // 新しいバッファを作成
          const newPositions = new Float32Array(newSize * 3);
          const newAttribute = new THREE.BufferAttribute(newPositions, 3);
          newAttribute.setUsage(THREE.DynamicDrawUsage);
          pastGeometry.setAttribute('position', newAttribute);
          bufferSizeRef.current = newSize;
        }
        
        // 既存のバッファにデータをコピー
        const positions = positionAttribute.array as Float32Array;
        const maxVertices = positions.length / 3;
        
        // バッファオーバーフローを防ぐチェック
        if (pastPoints.length > maxVertices) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`TrajectoryPath: Attempted to render ${pastPoints.length} vertices, but buffer only supports ${maxVertices} vertices`);
          }
          return;
        }
        
        let index = 0;
        for (const point of pastPoints) {
          // 境界チェックを追加
          if (index + 2 >= positions.length) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('TrajectoryPath: Buffer overflow prevented during position update');
            }
            break;
          }
          positions[index++] = point[0];
          positions[index++] = point[1];
          positions[index++] = point[2];
        }
        
        // 実際に描画する頂点数を設定（安全な範囲内で）
        const safeVertexCount = Math.min(pastPoints.length, maxVertices);
        pastGeometry.setDrawRange(0, safeVertexCount);
        positionAttribute.needsUpdate = true;
        pastGeometry.computeBoundingSphere();
      } else {
        // ポイントが1個以下の場合は描画範囲を0に設定
        pastGeometry.setDrawRange(0, 0);
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
  // InstancedMeshの最大インスタンス数を取得（初期化時に設定された値）
  const maxInstances = instancedMesh.instanceMatrix.count;
  
  // ポイントが無い場合はInstancedMeshを非表示
  if (points.length === 0) {
    instancedMesh.count = 0;
    return;
  }
  
  // 実際に表示可能な点数を計算（最大インスタンス数を超えないように）
  const pointCount = Math.min(points.length, maxInstances);
  
  // バッファオーバーフローを防ぐため、事前チェック
  if (pointCount > maxInstances) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`TrajectoryPath: Attempted to render ${pointCount} points, but InstancedMesh only supports ${maxInstances} instances`);
    }
    return;
  }
  
  // 各ポイントの位置を設定
  for (let i = 0; i < pointCount; i++) {
    const [x, y, z] = points[i];
    
    // Matrix4を明示的に作成して位置を設定
    const matrix = new THREE.Matrix4();
    matrix.makeTranslation(x, y, z);
    
    instancedMesh.setMatrixAt(i, matrix);
  }
  
  // 表示するインスタンス数を安全に設定
  instancedMesh.count = Math.max(0, Math.min(pointCount, maxInstances));
  
  // バッファ更新を要求（描画前に同期される）
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