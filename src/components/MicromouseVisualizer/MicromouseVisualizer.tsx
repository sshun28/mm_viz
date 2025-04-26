import React, { useMemo, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Stats from 'stats.js';
import './MicromouseVisualizer.css';
import { MazeData, CameraViewPreset } from '../../types';
import { CELL_SIZE, cameraPresets } from '../../config/constants';
import CameraController from './CameraController';
import Maze from './Maze';
import CellMarker from './CellMarker';

// Stats.jsを使ったパフォーマンスモニターコンポーネント
const PerformanceMonitor: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const statsRef = useRef<Stats | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Stats.jsのインスタンスを作成
    const stats = new Stats();
    stats.showPanel(0); // 0: FPS, 1: MS, 2: MB, 3+: カスタムパネル
    stats.dom.style.position = 'absolute';
    stats.dom.style.top = '10px';
    stats.dom.style.left = '10px';
    stats.dom.style.zIndex = '100';
    document.body.appendChild(stats.dom);
    statsRef.current = stats;

    // クリーンアップ関数
    return () => {
      if (statsRef.current && statsRef.current.dom.parentElement) {
        statsRef.current.dom.parentElement.removeChild(statsRef.current.dom);
      }
    };
  }, [enabled]);

  // 毎フレーム実行
  useFrame(() => {
    if (enabled && statsRef.current) {
      statsRef.current.update();
    }
  });

  return null;
};

// --- Props定義 ---
interface MicromouseVisualizerProps {
  mazeData?: MazeData;
  width?: number;
  height?: number;
  backgroundColor?: string;
  showGridHelper?: boolean;
  showAxesHelper?: boolean;
  showStartMarker?: boolean;
  showGoalMarkers?: boolean;
  showPerformanceStats?: boolean; // パフォーマンス表示のオプション
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
  showStartMarker = true,
  showGoalMarkers = true,
  showPerformanceStats = false, // デフォルトはOFF
  initialViewPreset = 'angle',
  children,
}) => {

  // 迷路データがない場合は早期リターン
  if (!mazeData) {
    return <div style={{ width, height, backgroundColor: '#dddddd', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading Maze Data...</div>;
  }
  // ここから下では mazeData は undefined ではない

  const mazeSize = mazeData.size;

  // スタートとゴールのマーカーをメモ化
  const startAndGoalMarkers = useMemo(() => {
    if (!mazeData) return null;

    const markers = [];

    // スタートマーカー
    if (showStartMarker && mazeData.start) {
      markers.push(
        <CellMarker
          key="start-marker"
          cell={mazeData.start}
          color="green"
          opacity={0.7}
          scale={0.8}
          type="square"
        />
      );
    }

    // ゴールマーカー
    if (showGoalMarkers && mazeData.goal && mazeData.goal.length > 0) {
      mazeData.goal.forEach((goalCell, index) => {
        markers.push(
          <CellMarker
            key={`goal-marker-${index}`}
            cell={goalCell}
            color="red"
            opacity={0.7}
            scale={0.8}
            type="square"
          />
        );
      });
    }

    return markers;
  }, [mazeData, showStartMarker, showGoalMarkers]);

  const mazePhysicalSize = mazeSize * CELL_SIZE;

  const initialCameraPosition = cameraPresets[initialViewPreset].position as [number, number, number];

  return (
    <div style={{ width, height, position: 'relative' }} className="mm-visualizer">
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

        {/* スタート/ゴールマーカー */}
        {startAndGoalMarkers}

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

        {/* stats.jsによるパフォーマンスモニター */}
        <PerformanceMonitor enabled={showPerformanceStats} />

      </Canvas>
    </div>
  );
};

export default MicromouseVisualizer;