import React, { useMemo, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei'; // Lineコンポーネントをインポート
import * as THREE from 'three';
import Stats from 'stats.js';
import { MazeData, CameraViewPreset } from '../../types';
import { CELL_SIZE, cameraPresets } from '../../config/constants';
import CameraController, { CameraControlAPI } from './CameraController';
import Maze from './Maze';
import CellMarker from './CellMarker';
import { useData } from '../../providers/DataProvider';

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
    const mazePhysicalSize = mazeSize * cellSize;
    const lineOpacity = 0.4; // グリッド線の透明度
    
    // すべての線の点を格納する配列
    const allLines: [number, number, number][] = [];
    
    // 水平方向のライン
    for (let i = 0; i < mazeSize; i++) {
      const y = i * cellSize + cellSize / 2; // セルの中心を通るように配置
      // 1本の線につき2点（始点と終点）
      allLines.push([0, y, 0.001]);
      allLines.push([mazePhysicalSize, y, 0.001]);
    }
    
    // 垂直方向のライン
    for (let i = 0; i < mazeSize; i++) {
      const x = i * cellSize + cellSize / 2; // セルの中心を通るように配置
      // 1本の線につき2点（始点と終点）
      allLines.push([x, 0, 0.001]);
      allLines.push([x, mazePhysicalSize, 0.001]);
    }
    
    // 斜めのライン
    if (showDiagonalLines) {
      // 斜め（左下から右上）のライン
      for (let i = -1; i < 2 * mazeSize; i++) {
        // i は対角線のインデックス（-1からスタート）
        
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
            // 線分を追加
            allLines.push([startX, startY, 0.001]);
            allLines.push([endX, endY, 0.001]);
          }
        }
      }
      
      // 斜め（右下から左上）のライン
      for (let i = -1; i < 2 * mazeSize; i++) {
        // i は対角線のインデックス（-1からスタート）
        
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
          
          // 範囲チェック - 迷路の四隅を超える線は描画しない
          if (!(startX === mazePhysicalSize && startY === 0) && 
              !(endX === 0 && endY === mazePhysicalSize) &&
              !(startX === 0 && startY === mazePhysicalSize) && 
              !(endX === mazePhysicalSize && endY === 0)) {
            // 線分を追加
            allLines.push([startX, startY, 0.001]);
            allLines.push([endX, endY, 0.001]);
          }
        }
      }
    }
    
    // すべての線を一つのLineコンポーネントで描画
    return (
      <Line
        points={allLines}
        color={horizontalColor} // すべての線に同じ色を適用
        opacity={lineOpacity}
        transparent
        lineWidth={1}
        segments={true} // セグメントとして描画
      />
    );
  }, [mazeSize, cellSize, horizontalColor, verticalColor, diagonalColor, showDiagonalLines]);
  
  return gridLines;
};

// --- Visualizer API型定義 ---
export interface MicromouseVisualizerAPI {
  setCameraView: (preset: CameraViewPreset) => void;
  resetCamera: (preset?: CameraViewPreset) => void;
  toggleCameraProjection: () => void;
  zoomToRegion: (x1: number, y1: number, x2: number, y2: number) => void;
}

// --- Props定義 ---
interface MicromouseVisualizerProps {
  width?: number | string;
  height?: number | string;
  backgroundColor?: string;
  showGridHelper?: boolean;
  showAxesHelper?: boolean;
  showPerformanceStats?: boolean; // パフォーマンス表示のオプション
  showDiagonalGrid?: boolean; // 斜めグリッドを表示するかどうか
  initialViewPreset?: CameraViewPreset;
  className?: string; // TailwindCSSなどのクラス名を受け取る
  style?: React.CSSProperties; // インラインスタイルも受け取れるように
  children?: React.ReactNode;
  cameraRef?: React.MutableRefObject<CameraControlAPI | null>; // useCameraフック用のカメラref
}

// --- メインコンポーネント ---
export const MicromouseVisualizer = forwardRef<MicromouseVisualizerAPI, MicromouseVisualizerProps>((
  {
    width = '100%',
    height = '100%',
    backgroundColor = '#181818',
    showGridHelper = false,
    showAxesHelper = false,
    showPerformanceStats = false, // デフォルトはOFF
    showDiagonalGrid = true, // デフォルトは表示する
    initialViewPreset = 'angle',
    className,
    style,
    children,
    cameraRef, // 外部からのカメラref
  },
  ref
) => {
  const internalCameraRef = useRef<CameraControlAPI | null>(null);
  // 外部のcameraRefが提供されている場合はそれを使用、そうでなければ内部のrefを使用
  const actualCameraRef = cameraRef || internalCameraRef;

  // DataProviderからmazeDataを取得
  const mazeData = useData((state) => state.mazeData);

  // デフォルトの迷路サイズ（データがない場合）
  const DEFAULT_MAZE_SIZE = 16;
  
  // 迷路サイズの決定（データがない場合はデフォルト値を使用）
  const mazeSize = mazeData?.size || DEFAULT_MAZE_SIZE;
  const mazePhysicalSize = mazeSize * CELL_SIZE;
  const initialCameraPosition = cameraPresets[initialViewPreset].position as [number, number, number];

  // 外部からカメラを操作できるAPIを公開
  useImperativeHandle(ref, () => ({
    setCameraView: (preset: CameraViewPreset) => {
      if (actualCameraRef.current) {
        actualCameraRef.current.setCameraView(preset);
      }
    },
    resetCamera: (preset?: CameraViewPreset) => {
      if (actualCameraRef.current) {
        actualCameraRef.current.resetCamera(preset);
      }
    },
    toggleCameraProjection: () => {
      if (actualCameraRef.current) {
        actualCameraRef.current.toggleCameraProjection();
      }
    },
    zoomToRegion: (x1: number, y1: number, x2: number, y2: number) => {
      if (actualCameraRef.current) {
        actualCameraRef.current.zoomToRegion(x1, y1, x2, y2);
      }
    },
  }), [actualCameraRef]);

  return (
    <div 
      className={className}
      style={{ 
        width, 
        height, 
        position: 'relative',
        ...style 
      }}
    >
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

        {/* 迷路（データがある場合のみ表示） */}
        {/* Mazeコンポーネントの原点をシーンの原点に合わせる */}
        {mazeData && (
          <group position={[0, 0, 0]}>
            <Maze mazeData={mazeData} />
          </group>
        )}

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
        <CameraController ref={actualCameraRef} initialViewPreset={initialViewPreset} mazeSize={mazeSize} />

        {/* stats.jsによるパフォーマンスモニター */}
        <PerformanceMonitor enabled={showPerformanceStats} />

      </Canvas>
      {/* データがない場合のオーバーレイ表示 */}
      {!mazeData && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#CCCCCC',
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          Loading Maze Data...
        </div>
      )}
    </div>
  );
});

MicromouseVisualizer.displayName = 'MicromouseVisualizer';

export default MicromouseVisualizer;