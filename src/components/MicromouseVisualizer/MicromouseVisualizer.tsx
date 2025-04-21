import React, { useState, useEffect, useMemo } from 'react'; // useMemo をインポート
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import './MicromouseVisualizer.css';
import { MazeData, MouseState, CameraViewPreset } from '../../types'; // Import types
import { CELL_SIZE, FLOOR_THICKNESS, cameraPresets } from '../../config/constants'; // Import constants
import CameraController from './CameraController'; // Import extracted component
import Maze from './Maze'; // Import extracted component
import Mouse from './Mouse'; // Import extracted component

// --- Props定義 (設計ドキュメントから一部抜粋) ---
interface MicromouseVisualizerProps {
  mazeData?: MazeData;
  initialMouseState?: MouseState;
  width?: number;
  height?: number;
  backgroundColor?: string;
  showGridHelper?: boolean;
  showAxesHelper?: boolean;
  initialViewPreset?: CameraViewPreset; // Use imported type
}

// --- メインコンポーネント ---
export const MicromouseVisualizer: React.FC<MicromouseVisualizerProps> = ({
  mazeData,
  initialMouseState, // Propとして受け取る初期状態
  width = 800,
  height = 600,
  backgroundColor = '#f0f0f0',
  showGridHelper = false, // デフォルトは非表示に変更
  showAxesHelper = false, // デフォルトは非表示に変更
  initialViewPreset = 'angle',
}) => {
  // デフォルトのマウス状態を useMemo でメモ化
  const defaultMouseState = useMemo<MouseState>(() => ({
    position: { x: mazeData?.start?.x ?? 0, y: mazeData?.start?.y ?? 0 }, // スタート地点をデフォルトに
    angle: Math.PI / 2, // 北向き (+Y方向)
  }), [mazeData?.start?.x, mazeData?.start?.y]); // mazeData の start 座標に依存

  // useStateの初期値は initialMouseState があればそれ、なければメモ化した defaultMouseState を使用
  const [currentMouseState, setCurrentMouseState] = useState<MouseState>(
     initialMouseState ?? defaultMouseState
  );

  // Propsの変更を監視して内部状態を更新
  useEffect(() => {
    // initialMouseState が変更された場合、または mazeData が変更されて defaultMouseState が更新された場合に
    // currentMouseState を更新する
    // initialMouseState が指定されていればそれを優先、なければ defaultMouseState を使う
    setCurrentMouseState(initialMouseState ?? defaultMouseState);
  }, [initialMouseState, defaultMouseState]); // 依存配列を修正

  // 迷路データがない場合は何も表示しないか、ローディング表示
  if (!mazeData) {
    return <div style={{ width, height, backgroundColor: '#dddddd', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading Maze Data...</div>;
  }

  const mazeSize = mazeData.size;
  const mazePhysicalSize = mazeSize * CELL_SIZE;
  // グリッドヘルパーと軸ヘルパーの中心を迷路の中心に合わせる
  // const helperCenterOffset = mazePhysicalSize / 2 - CELL_SIZE / 2; // Z-upでは不要かも

  // カメラプリセットの位置をタプル型にキャスト
  const initialCameraPosition = cameraPresets[initialViewPreset].position as [number, number, number];

  return (
    // CSSクラス名を修正
    <div style={{ width, height }} className="mm-visualizer">
      <Canvas
         shadows // 影を有効化 (必要に応じて)
         // Z-up設定を追加
         camera={{ fov: 50, near: 0.1, far: 1000, position: initialCameraPosition, up: [0, 0, 1] }} // 初期カメラ位置も設定
         style={{ background: backgroundColor }}
         // onCreated={({ gl }) => gl.setClearColor(backgroundColor)} // 背景色設定の別方法
      >
        {/* ライト設定 (Z-upに合わせて調整) */}
        <ambientLight intensity={0.7} /> {/* 環境光を少し強く */}
        <directionalLight
            // positionのYとZを入れ替え
            position={[mazePhysicalSize * 0.5, mazePhysicalSize * 0.5, mazePhysicalSize]} // 光源の位置を迷路サイズに連動させる
            intensity={1.0} // 主光源の強度
            castShadow // 影を生成
            shadow-mapSize-width={1024} // 影の解像度
            shadow-mapSize-height={1024}
            // shadow-camera-* の調整 (Z-upでは通常不要だが、範囲を広げる)
            shadow-camera-far={mazePhysicalSize * 3}
            shadow-camera-left={-mazePhysicalSize * 1.5} // 範囲を広めに設定
            shadow-camera-right={mazePhysicalSize * 1.5}
            shadow-camera-top={mazePhysicalSize * 1.5}
            shadow-camera-bottom={-mazePhysicalSize * 1.5}
        />
        {/* 補助光のpositionも調整 */}
        <directionalLight position={[-5, -5, -5]} intensity={0.3} /> {/* 補助光 */}

        {/* 迷路 */}
        <group position={[0, 0, 0]}>
            <Maze mazeData={mazeData} />
        </group>


        {/* マウス */}
        {/* currentMouseStateは常にMouseState型になるためチェック不要 */}
        <Mouse mouseState={currentMouseState} mazeSize={mazeSize}/>

        {/* ヘルパー (Z-upに合わせて調整) */}
        {showGridHelper && (
            <primitive
                object={new THREE.GridHelper(mazePhysicalSize, mazeSize, '#888888', '#bbbbbb')}
                // X-Y平面に配置するため回転が必要
                rotation={[Math.PI / 2, 0, 0]}
                // position={[0, 0, FLOOR_THICKNESS / 2]} // Z座標を床の上面(0)に修正
                position={[0, 0, 0]} // Z座標を床の上面(0)に修正
            />
        )}
        {showAxesHelper && (
            <primitive
                object={new THREE.AxesHelper(mazePhysicalSize * 0.6)}
                // Zが上になるように回転は不要
                // position={[0, 0, FLOOR_THICKNESS / 2 + 0.01]} // Z座標を床の上面(0)に修正 (わずかなオフセットは削除)
                position={[0, 0, 0]} // Z座標を床の上面(0)に修正
            />
        )}

        {/* カメラコントロール */}
        <CameraController initialViewPreset={initialViewPreset} mazeSize={mazeSize} />

      </Canvas>
    </div>
  );
};

export default MicromouseVisualizer;