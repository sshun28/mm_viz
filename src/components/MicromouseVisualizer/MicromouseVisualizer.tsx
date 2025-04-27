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

// カスタムグリッドコンポーネント
const CustomGrid: React.FC<{
  mazeSize: number;
  cellSize: number;
  showDiagonalLines?: boolean;
  horizontalColor?: string;
  verticalColor?: string;
  diagonalColor?: string;
}> = ({
  mazeSize,
  cellSize,
  showDiagonalLines = true,
  horizontalColor = '#888888',
  verticalColor = '#888888',
  diagonalColor = '#aaaaaa',
}) => {
  // グリッドのラインを生成する関数
  const gridLines = useMemo(() => {
    const lines: JSX.Element[] = [];
    const mazePhysicalSize = mazeSize * cellSize;
    const lineOpacity = 0.4; // グリッド線の透明度
    
    // 水平方向のライン (CELL_SIZE*(n+0.5)の位置)
    for (let i = 0; i < mazeSize; i++) {
      const positions = [];
      const y = i * cellSize + cellSize / 2; // セルの中心を通るように配置
      
      // グリッド線の端点を設定
      positions.push(0, y, 0.001); // 始点
      positions.push(mazePhysicalSize, y, 0.001); // 終点
      
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      
      lines.push(
        <line key={`horizontal-${i}`}>
          <bufferGeometry attach="geometry" {...geometry} />
          <lineBasicMaterial
            attach="material"
            color={horizontalColor}
            transparent
            opacity={lineOpacity}
            linewidth={1}
          />
        </line>
      );
    }
    
    // 垂直方向のライン (CELL_SIZE*(n+0.5)の位置)
    for (let i = 0; i < mazeSize; i++) {
      const positions = [];
      const x = i * cellSize + cellSize / 2; // セルの中心を通るように配置
      
      // グリッド線の端点を設定
      positions.push(x, 0, 0.001); // 始点
      positions.push(x, mazePhysicalSize, 0.001); // 終点
      
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      
      lines.push(
        <line key={`vertical-${i}`}>
          <bufferGeometry attach="geometry" {...geometry} />
          <lineBasicMaterial
            attach="material"
            color={verticalColor}
            transparent
            opacity={lineOpacity}
            linewidth={1}
          />
        </line>
      );
    }
    
    // 斜めのライン
    if (showDiagonalLines) {
      // 斜め（左下から右上）のライン - 45度に修正
      // セルの中心を通過する線を配置
      for (let i = -1; i < 2 * mazeSize; i++) {
        // i は対角線のインデックス（-1からスタート）
        const positions = [];
        
        // 対角線の開始点と終了点を計算
        let startX, startY, endX, endY;
        
        if (i < mazeSize) {
          // 左辺からスタートする対角線
          startX = 0;
          startY = (mazeSize - 1 - i) * cellSize + cellSize / 2; // セルの中心を通る
          
          // 特殊ケース: i = -1 のとき、(CELL_SIZE/2, 0)からの線を描画
          if (i === -1) {
            startX = cellSize / 2;
            startY = 0;
          }
        } else {
          // 下辺からスタートする対角線
          startX = (i - mazeSize + 1) * cellSize + cellSize / 2; // セルの中心を通る
          startY = 0;
        }
        
        // 終点は迷路の端まで延長
        const diagonal = Math.min(
          mazePhysicalSize - startX,
          mazePhysicalSize - startY
        );
        
        endX = startX + diagonal;
        endY = startY + diagonal;
        
        // 右下の角に表示される線をスキップする
        // 1. 下辺からスタートする線で、セルの中心を通過しない場合はスキップ
        if (i >= mazeSize && 
            ((i === 2 * mazeSize - 1) || 
             (startX >= (mazeSize - 1) * cellSize && startY === 0))) {
          continue; // 右下の角付近の線はスキップ
        }
        
        // 範囲チェック
        if (startX >= 0 && startY >= 0 && endX <= mazePhysicalSize && endY <= mazePhysicalSize) {
          // 四隅のチェック
          if (!(startX === 0 && startY === 0) && 
              !(endX === mazePhysicalSize && endY === mazePhysicalSize)) {
            // グリッド線の端点を設定
            positions.push(startX, startY, 0.001); // 始点
            positions.push(endX, endY, 0.001); // 終点
            
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            
            lines.push(
              <line key={`diagonal1-${i}`}>
                <bufferGeometry attach="geometry" {...geometry} />
                <lineBasicMaterial
                  attach="material"
                  color={diagonalColor}
                  transparent
                  opacity={lineOpacity * 0.8} // 斜め線は少し薄めに
                  linewidth={1}
                />
              </line>
            );
          }
        }
      }
      
      // 斜め（右下から左上）のライン - 壁の中心を通るように修正
      for (let i = -1; i < 2 * mazeSize; i++) {
        // i は対角線のインデックス（-1からスタート）
        const positions = [];
        
        // 対角線の開始点と終了点を計算
        let startX, startY, endX, endY;
        
        if (i < mazeSize) {
          // 右辺からスタートする対角線
          startX = mazePhysicalSize;
          startY = (mazeSize - 1 - i) * cellSize + cellSize / 2; // セルの中心を通る
          
          // 特殊ケース: i = -1 のとき、(0, CELL_SIZE*(size-0.5))からの線を描画
          if (i === -1) {
            startX = 0;
            startY = (mazeSize - 0.5) * cellSize;
          }
        } else {
          // 下辺からスタートする対角線
          startX = mazePhysicalSize - (i - mazeSize + 1) * cellSize - cellSize / 2; // セルの中心を通る
          startY = 0;
        }
        
        // 特殊ケース: i = -1 の対応終点計算
        if (i === -1) {
          // (0, CELL_SIZE*(size-0.5))からの線の終点計算
          // この線は左上から右下に向かうので、終点のxは正方向、yは負方向
          endX = Math.min(mazePhysicalSize, startY);
          endY = Math.max(0, startY - endX);
        } else {
          // 通常の終点計算
          const diagonal = Math.min(
            startX,
            mazePhysicalSize - startY
          );
          endX = startX - diagonal;
          endY = startY + diagonal;
        }
        
        // 範囲チェック（迷路の外はスキップ）
        if (startX >= 0 && startY >= 0 && 
            ((i === -1 && endX <= mazePhysicalSize && endY >= 0) || 
             (i !== -1 && endX >= 0 && endY <= mazePhysicalSize))) {
          // グリッド線の端点を設定
          positions.push(startX, startY, 0.001); // 始点
          positions.push(endX, endY, 0.001); // 終点
          
          // 範囲チェック - 迷路の四隅を超える線は描画しない
          if (!(startX === mazePhysicalSize && startY === 0) && 
              !(endX === 0 && endY === mazePhysicalSize) &&
              !(startX === 0 && startY === mazePhysicalSize) && 
              !(endX === mazePhysicalSize && endY === 0)) {
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            
            lines.push(
              <line key={`diagonal2-${i}`}>
                <bufferGeometry attach="geometry" {...geometry} />
                <lineBasicMaterial
                  attach="material"
                  color={diagonalColor}
                  transparent
                  opacity={lineOpacity * 0.8} // 斜め線は少し薄めに
                  linewidth={1}
                />
              </line>
            );
          }
        }
      }
    }
    
    return lines;
  }, [mazeSize, cellSize, horizontalColor, verticalColor, diagonalColor, showDiagonalLines]);
  
  return <>{gridLines}</>;
};

// --- Props定義 ---
interface MicromouseVisualizerProps {
  mazeData?: MazeData;
  width?: number;
  height?: number;
  backgroundColor?: string;
  showGridHelper?: boolean;
  showAxesHelper?: boolean;
  showPerformanceStats?: boolean; // パフォーマンス表示のオプション
  showDiagonalGrid?: boolean; // 斜めグリッドを表示するかどうか
  initialViewPreset?: CameraViewPreset;
  children?: React.ReactNode;
}

// --- メインコンポーネント ---
export const MicromouseVisualizer: React.FC<MicromouseVisualizerProps> = ({
  mazeData,
  width = 800,
  height = 600,
  backgroundColor = '#181818',
  showGridHelper = false,
  showAxesHelper = false,
  showPerformanceStats = false, // デフォルトはOFF
  showDiagonalGrid = true, // デフォルトは表示する
  initialViewPreset = 'angle',
  children,
}) => {

  // 迷路データがない場合は早期リターン
  if (!mazeData) {
    return <div style={{ width, height, backgroundColor: '#181818', display: 'flex', justifyContent: 'center', alignItems: 'center', color:"#CCCCCC" }}>Loading Maze Data...</div>;
  }
  // ここから下では mazeData は undefined ではない

  const mazeSize = mazeData.size;

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

        {/* children をレンダリング */}
        {children}

        {/* カスタムグリッド */}
        {showGridHelper && (
          <CustomGrid 
            mazeSize={mazeSize}
            cellSize={CELL_SIZE}
            showDiagonalLines={showDiagonalGrid}
            horizontalColor="#888888"
            verticalColor="#888888" 
            diagonalColor="#aaaaaa"
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