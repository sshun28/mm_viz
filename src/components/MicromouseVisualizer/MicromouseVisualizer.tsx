import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Billboard, OrbitControls, Text } from '@react-three/drei';
import './MicromouseVisualizer.css';

export interface MicromouseVisualizerProps {
  /**
   * 迷路のデータ
   */
  mazeData?: any; // 後で適切な型を定義します
  /**
   * コンポーネントの幅
   */
  width?: number;
  /**
   * コンポーネントの高さ
   */
  height?: number;
  /**
   * 背景色
   */
  backgroundColor?: string;
  /**
   * グリッドのサイズ (X, Y) - XとYは常に同じ値を取ります
   */
  gridSize?: number;
  /**
   * axesHelperの表示を制御する
   */
  showAxesHelper?: boolean;
}

/**
 * マイクロマウスの迷路と動きを可視化するコンポーネント
 */
export const MicromouseVisualizer: React.FC<MicromouseVisualizerProps> = ({
  mazeData,
  width = 500,
  height = 500,
  backgroundColor = '#ffffff',
  gridSize = 16,
  showAxesHelper = true, // 新しいプロパティ
}) => {
  const cellSize = 0.09;

  return (
    <div
      className="mm-visualizer"
      style={{ width: `${width}px`, height: `${height}px`, backgroundColor }}
    >
      <Canvas>
        {/* グリッドと地面をX-Y平面に配置 */}
        <gridHelper 
          args={[gridSize * cellSize, gridSize]} 
          position={[cellSize * gridSize / 2, 0, cellSize * gridSize / 2]} 
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cellSize * gridSize / 2, 0, cellSize * gridSize / 2]}>
          <planeGeometry args={[(gridSize + 2) * cellSize, (gridSize + 2) * cellSize]} />
          <meshStandardMaterial color="#e0e0e0" />
        </mesh>
        {/* 原点およびX,Y,Zの方向を示すヘルパーを追加 */}
        {showAxesHelper && (
          <>
            <axesHelper args={[1]} position={[0, 0, 0]} />
            {/* 軸のラベルを追加 - billboardプロパティを追加して常にカメラ方向を向くように設定 */}
            <Text position={[1.1, 0, 0]} fontSize={0.1} color="red" >X</Text>
            <Text position={[0, 1.1, 0]} fontSize={0.1} color="green">Y</Text>
            <Text position={[0, 0, 1.1]} fontSize={0.1} color="blue">Z</Text>
          </>
        )}
        {/* 視点操作をZ軸まわりの動作に修正 */}
        <OrbitControls />
      </Canvas>
    </div>
  );
};

export default MicromouseVisualizer;