import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import './MicromouseVisualizer.css';
// MouseState のインポートを削除
import { MazeData, CameraViewPreset } from '../../types'; // Import types
import { CELL_SIZE, /* FLOOR_THICKNESS, */ cameraPresets } from '../../config/constants'; // FLOOR_THICKNESS は未使用なのでコメントアウト
import CameraController from './CameraController'; // Import extracted component
import Maze from './Maze'; // Import extracted component
// Mouse のインポートを削除

// --- Props定義 ---
interface MicromouseVisualizerProps {
  mazeData?: MazeData; // mazeData は optional のまま
  width?: number;
  height?: number;
  backgroundColor?: string;
  showGridHelper?: boolean;
  showAxesHelper?: boolean;
  initialViewPreset?: CameraViewPreset;
  children?: React.ReactNode;
}

// --- メインコンポーネント ---
export const MicromouseVisualizer: React.FC<MicromouseVisualizerProps> = ({
  mazeData,
  width = 800,
  height = 600,
  backgroundColor = '#f0f0f0',
  showGridHelper = false,
  showAxesHelper = false,
  initialViewPreset = 'angle',
  children,
}) => {

  // 迷路データがない場合は早期リターン
  if (!mazeData) {
    return <div style={{ width, height, backgroundColor: '#dddddd', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading Maze Data...</div>;
  }
  // ここから下では mazeData は undefined ではない

  const mazeSize = mazeData.size;

  // --- マウス状態管理の削除 (コメントも整理) ---

  const mazePhysicalSize = mazeSize * CELL_SIZE;

  const initialCameraPosition = cameraPresets[initialViewPreset].position as [number, number, number];

  return (
    <div style={{ width, height }} className="mm-visualizer">
      <Canvas
         shadows
         camera={{ fov: 50, near: 0.1, far: 1000, position: initialCameraPosition, up: [0, 0, 1] }}
         style={{ background: backgroundColor }}
      >
        {/* ライト設定 */}
        <ambientLight intensity={0.7} />
        <directionalLight
            position={[mazePhysicalSize * 0.5, mazePhysicalSize * 0.5, mazePhysicalSize]}
            intensity={1.0}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-far={mazePhysicalSize * 3}
            shadow-camera-left={-mazePhysicalSize * 1.5}
            shadow-camera-right={mazePhysicalSize * 1.5}
            shadow-camera-top={mazePhysicalSize * 1.5}
            shadow-camera-bottom={-mazePhysicalSize * 1.5}
        />
        <directionalLight position={[-5, -5, -5]} intensity={0.3} />

        {/* 迷路 (mazeData は undefined でないことが保証されている) */}
        {/* Mazeコンポーネントの原点をシーンの原点に合わせる */}
        <group position={[0, 0, 0]}>
             <Maze mazeData={mazeData} />
        </group>

        {/* children をレンダリング */}
        {children}

        {/* ヘルパー */}
        {showGridHelper && (
            <primitive
                object={new THREE.GridHelper(mazePhysicalSize, mazeSize, '#888888', '#bbbbbb')}
                rotation={[Math.PI / 2, 0, 0]}
                position={[mazePhysicalSize / 2, mazePhysicalSize / 2, 0]}
            />
        )}
        {showAxesHelper && (
            <primitive
                object={new THREE.AxesHelper(mazePhysicalSize * 0.6)}
                position={[0, 0, 0]}
            />
        )}

        {/* カメラコントロール */}
        <CameraController initialViewPreset={initialViewPreset} mazeSize={mazeSize} />

      </Canvas>
    </div>
  );
};

export default MicromouseVisualizer;