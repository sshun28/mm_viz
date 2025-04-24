// filepath: /workspaces/mm_viz/src/components/MicromouseVisualizer/CellMarker.tsx
import React from 'react';
import * as THREE from 'three';
import { CELL_SIZE, FLOOR_THICKNESS } from '../../config/constants';

// CellMarkerのProps定義
export interface CellMarkerProps {
  cell: { x: number; y: number }; // 対象のセル座標
  color?: string;                 // マーカーの色
  opacity?: number;               // 透明度
  scale?: number;                 // マーカーのサイズ比率 (0-1)
  height?: number;                // 床からの高さオフセット
  type?: 'square' | 'circle' | 'diamond'; // マーカーの形状
}

/**
 * 特定のセルに視覚的なマーカーを配置するコンポーネント
 * 迷路のスタート、ゴール、訪問済みセル、現在位置など様々な用途に使用可能
 */
const CellMarker: React.FC<CellMarkerProps> = ({
  cell,
  color = '#ffffff',
  opacity = 0.7,
  scale = 0.8,
  height = 0.001,
  type = 'square',
}) => {
  // セル座標から物理座標への変換
  const posX = cell.x * CELL_SIZE + CELL_SIZE / 2;
  const posY = cell.y * CELL_SIZE + CELL_SIZE / 2;
  const posZ = FLOOR_THICKNESS / 2 + height;

  // 形状に応じたジオメトリを選択
  let geometry;
  switch (type) {
    case 'circle': {
      // 円形マーカー
      geometry = <circleGeometry args={[CELL_SIZE * scale / 2, 32]} />;
      break;
    }
    case 'diamond': {
      // ひし形マーカー
      geometry = (
        <shapeGeometry args={[
          new THREE.Shape([
            new THREE.Vector2(0, CELL_SIZE * scale / 2),
            new THREE.Vector2(CELL_SIZE * scale / 2, 0),
            new THREE.Vector2(0, -CELL_SIZE * scale / 2),
            new THREE.Vector2(-CELL_SIZE * scale / 2, 0),
          ])
        ]} />
      );
      break;
    }
    case 'square':
    default: {
      // 四角形マーカー（デフォルト）
      geometry = <planeGeometry args={[CELL_SIZE * scale, CELL_SIZE * scale]} />;
      break;
    }
  }

  return (
    <mesh position={[posX, posY, posZ]} rotation={[0, 0, 0]}>
      {geometry}
      <meshStandardMaterial 
        color={color} 
        side={THREE.DoubleSide} 
        transparent={opacity < 1} 
        opacity={opacity}
      />
    </mesh>
  );
};

export default CellMarker;