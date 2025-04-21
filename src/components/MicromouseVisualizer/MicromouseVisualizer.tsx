import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
// GridHelper を @react-three/drei から削除
import { OrbitControls, useHelper } from '@react-three/drei';
// AxesHelper と GridHelper を three からインポート
import * as THREE from 'three';
import './MicromouseVisualizer.css';

// --- データ構造定義 (設計ドキュメントから) ---
interface MazeData {
  size: number;
  walls: {
    vwall: boolean[][];
    hwall: boolean[][];
  };
  start: { x: number; y: number };
  goal: { x: number; y: number }[];
}

interface MouseState {
  position: { x: number; y: number }; // 物理座標[m]単位 (Three.js空間に対応)
  angle: number; // 物理角度[rad] Z軸周りの回転 (Three.js空間に対応)
}

// --- Props定義 (設計ドキュメントから一部抜粋) ---
interface MicromouseVisualizerProps {
  mazeData?: MazeData;
  initialMouseState?: MouseState;
  width?: number;
  height?: number;
  backgroundColor?: string;
  showGridHelper?: boolean;
  showAxesHelper?: boolean;
  initialViewPreset?: 'top' | 'angle' | 'side';
}

// --- 定数 ---
const CELL_SIZE = 0.18; // 1マスの物理サイズ[m] (Three.js空間での単位)
const WALL_HEIGHT = 0.05; // 壁の高さ[m]
const WALL_THICKNESS = 0.012; // 壁の厚み[m]
const FLOOR_THICKNESS = 0.01; // 床の厚み[m]
const MOUSE_SIZE = CELL_SIZE * 0.5; // マウスの仮サイズ

// --- カメラプリセット ---
// 座標系: Yが上、Xが右、Zが手前
const cameraPresets = {
  top: { position: [0, 10, 0], target: [0, 0, 0] }, // 真上から
  angle: { position: [5, 5, 5], target: [0, 0, 0] }, // 斜め上から
  side: { position: [5, 1, 0], target: [0, 0, 0] }, // 横から
};

// --- 内部コンポーネント ---

// カメラコントロール用コンポーネント
const CameraController: React.FC<{
  initialViewPreset?: 'top' | 'angle' | 'side';
  mazeSize?: number;
}> = ({ initialViewPreset = 'angle', mazeSize = 16 }) => {
  const { camera, controls } = useThree();
  // useRefの初期値をnullに設定
  const controlsRef = useRef<any>(null);

  const setCameraView = (presetKey: 'top' | 'angle' | 'side') => {
    const preset = cameraPresets[presetKey];
    // 迷路サイズに基づいてカメラ位置を調整
    const mazePhysicalSize = mazeSize * CELL_SIZE;
    const scale = mazePhysicalSize / 2; // 迷路中心からの距離の目安
    // プリセットの方向ベクトルを維持しつつ、迷路サイズに応じた距離に調整
    // Y軸方向の距離は少し多めに確保（特にTop View以外）
    const distanceFactor = presetKey === 'top' ? Math.max(5, mazePhysicalSize * 1.2) : Math.max(5, mazePhysicalSize * 1.5);
    const adjustedPosition = new THREE.Vector3(...preset.position).normalize().multiplyScalar(distanceFactor);
    const target = new THREE.Vector3(...preset.target); // ターゲットは常に中心(0,0,0)

    camera.position.copy(adjustedPosition);
    if (controlsRef.current) {
      controlsRef.current.target.copy(target);
      controlsRef.current.update();
    } else if (controls) {
      // @ts-ignore OrbitControlsにtargetプロパティがあることを期待
      controls.target.copy(target);
      // @ts-ignore OrbitControlsにupdateメソッドがあることを期待
      controls.update();
    }
    camera.lookAt(target); // カメラの向きをターゲットに設定
    camera.updateProjectionMatrix(); // カメラの変更を適用
  };

  useEffect(() => {
    setCameraView(initialViewPreset);
  }, [initialViewPreset, camera, controls, mazeSize]); // mazeSizeも依存配列に追加

  // カメラリセット機能（内部関数として定義）
  const resetCamera = (presetKey: 'top' | 'angle' | 'side' = initialViewPreset) => {
    setCameraView(presetKey);
  };

  // 例: 'R'キーでカメラリセット、1,2,3でビュー切り替え
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'r' || event.key === 'R') {
        resetCamera(); // 現在の初期プリセットにリセット
      } else if (event.key === '1') {
        resetCamera('top');
      } else if (event.key === '2') {
        resetCamera('angle');
      } else if (event.key === '3') {
        resetCamera('side');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetCamera, initialViewPreset]); // initialViewPresetも依存


  return <OrbitControls ref={controlsRef} />;
};


// 迷路描画コンポーネント
const Maze: React.FC<{ mazeData: MazeData }> = ({ mazeData }) => {
  const { size, walls, start, goal } = mazeData;
  const mazeWidth = size * CELL_SIZE;
  const mazeDepth = size * CELL_SIZE;
  // 座標系の中心を(0,0,0)にするためのオフセット
  // Three.js空間: X軸が右、Y軸が上、Z軸が手前
  // 迷路座標: (0,0)が左上
  // 変換: Three.js X = (迷路X + 0.5) * CELL_SIZE - mazeWidth / 2
  //       Three.js Z = -(迷路Y + 0.5) * CELL_SIZE + mazeDepth / 2
  const offsetX = -mazeWidth / 2 + CELL_SIZE / 2;
  const offsetZ = mazeDepth / 2 - CELL_SIZE / 2; // Z軸は反転させる

  // 床
  const floor = (
    <mesh position={[0, -FLOOR_THICKNESS / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* 床面をPlaneGeometryからBoxGeometryに変更して厚みを持たせる */}
      <boxGeometry args={[mazeWidth, mazeDepth, FLOOR_THICKNESS]} />
      <meshStandardMaterial color="#cccccc" side={THREE.DoubleSide} />
    </mesh>
  );

  // 壁
  const wallElements: React.ReactNode[] = [];
  // 垂直壁 (vwall[y][x] はマス(x,y)の左の壁)
  for (let y = 0; y < size; y++) {
    // xは0からsizeまで（size+1列）
    for (let x = 0; x < size + 1; x++) {
      if (walls.vwall[y]?.[x]) { // 存在チェック
        // 壁の中心座標を計算
        const posX = offsetX + x * CELL_SIZE - CELL_SIZE / 2;
        const posZ = offsetZ - y * CELL_SIZE;
        wallElements.push(
          <mesh key={`vwall-${y}-${x}`} position={[posX, WALL_HEIGHT / 2, posZ]}>
            {/* 壁ジオメトリ: 厚み、高さ、長さ */}
            <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, CELL_SIZE]} />
            <meshStandardMaterial color="#555555" />
          </mesh>
        );
      }
    }
  }
  // 水平壁 (hwall[y][x] はマス(x,y)の上の壁)
  // yは0からsizeまで（size+1行）
  for (let y = 0; y < size + 1; y++) {
    for (let x = 0; x < size; x++) {
      if (walls.hwall[y]?.[x]) { // 存在チェック
        // 壁の中心座標を計算
        const posX = offsetX + x * CELL_SIZE;
        const posZ = offsetZ - y * CELL_SIZE + CELL_SIZE / 2;
        wallElements.push(
          <mesh key={`hwall-${y}-${x}`} position={[posX, WALL_HEIGHT / 2, posZ]}>
             {/* 壁ジオメトリ: 長さ、高さ、厚み */}
            <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
            <meshStandardMaterial color="#555555" />
          </mesh>
        );
      }
    }
  }

  // スタート地点マーカー (セルの中心に配置)
  const startMarker = (
    <mesh position={[offsetX + start.x * CELL_SIZE, FLOOR_THICKNESS / 2 + 0.001, offsetZ - start.y * CELL_SIZE]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[CELL_SIZE * 0.8, CELL_SIZE * 0.8]} />
      <meshStandardMaterial color="green" side={THREE.DoubleSide} transparent opacity={0.7}/>
    </mesh>
  );

  // ゴール地点マーカー (セルの中心に配置)
  const goalMarkers = goal.map((g, index) => (
    <mesh key={`goal-${index}`} position={[offsetX + g.x * CELL_SIZE, FLOOR_THICKNESS / 2 + 0.001, offsetZ - g.y * CELL_SIZE]} rotation={[-Math.PI / 2, 0, 0]}>
       <planeGeometry args={[CELL_SIZE * 0.8, CELL_SIZE * 0.8]} />
       <meshStandardMaterial color="red" side={THREE.DoubleSide} transparent opacity={0.7}/>
    </mesh>
  ));


  return (
    <group>
      {floor}
      {wallElements}
      {startMarker}
      {goalMarkers}
    </group>
  );
};

// マウス描画コンポーネント
const Mouse: React.FC<{ mouseState: MouseState; mazeSize: number }> = ({ mouseState, mazeSize }) => {
    const mazeWidth = mazeSize * CELL_SIZE;
    const mazeDepth = mazeSize * CELL_SIZE;
    const offsetX = -mazeWidth / 2 + CELL_SIZE / 2;
    const offsetZ = mazeDepth / 2 - CELL_SIZE / 2;

    // 物理座標をThree.js座標に変換
    // mouseState.position はセルの中心を基準とした物理座標と仮定
    const posX = offsetX + mouseState.position.x * CELL_SIZE;
    const posZ = offsetZ - mouseState.position.y * CELL_SIZE; // Y座標をZ座標にマッピングし反転

    // 角度をThree.jsの回転（Y軸周り）に変換
    // 設計: X軸方向(East)が0 rad, Y軸方向(North)がPI/2 rad
    // Three.js: +X軸方向が PI/2 rad, +Z軸方向(South)が PI rad, -X軸方向が 3PI/2 rad, -Z軸方向(North)が 0 rad
    // 変換: Three.js Y回転 = -設計角度 + PI/2
    const rotationY = -mouseState.angle + Math.PI / 2;


  return (
    <mesh position={[posX, MOUSE_SIZE / 2 + FLOOR_THICKNESS / 2, posZ]} rotation={[0, rotationY, 0]}>
      {/* 仮のBox形状 */}
      <boxGeometry args={[MOUSE_SIZE, MOUSE_SIZE, MOUSE_SIZE]} />
      <meshStandardMaterial color="blue" />
       {/* 向きを示すための矢印ヘルパー (ローカル座標系でX+方向を向く) */}
       <arrowHelper args={[new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), MOUSE_SIZE * 0.8, 0xffff00, MOUSE_SIZE * 0.3, MOUSE_SIZE * 0.2]} />
    </mesh>
  );
};


// --- メインコンポーネント ---
export const MicromouseVisualizer: React.FC<MicromouseVisualizerProps> = ({
  mazeData,
  initialMouseState,
  width = 800,
  height = 600,
  backgroundColor = '#f0f0f0',
  showGridHelper = false, // デフォルトは非表示に変更
  showAxesHelper = false, // デフォルトは非表示に変更
  initialViewPreset = 'angle',
}) => {
  const [currentMouseState, setCurrentMouseState] = useState<MouseState | undefined>(initialMouseState);

  // Propsの変更を監視して内部状態を更新
  useEffect(() => {
    // initialMouseStateが変更されたら内部状態も更新
    setCurrentMouseState(initialMouseState);
  }, [initialMouseState]);

  // 迷路データがない場合は何も表示しないか、ローディング表示
  if (!mazeData) {
    return <div style={{ width, height, backgroundColor: '#dddddd', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading Maze Data...</div>;
  }

  const mazeSize = mazeData.size;
  const mazePhysicalSize = mazeSize * CELL_SIZE;
  // グリッドヘルパーと軸ヘルパーの中心を迷路の中心に合わせる
  const helperCenterOffset = mazePhysicalSize / 2 - CELL_SIZE / 2;

  // カメラプリセットの位置をタプル型にキャスト
  const initialCameraPosition = cameraPresets[initialViewPreset].position as [number, number, number];

  return (
    <div style={{ width, height }} className="micromouse-visualizer-container">
      <Canvas
         shadows // 影を有効化 (必要に応じて)
         // cameraのpositionにタプル型を渡す
         camera={{ fov: 50, near: 0.1, far: 1000, position: initialCameraPosition }} // 初期カメラ位置も設定
         style={{ background: backgroundColor }}
         // onCreated={({ gl }) => gl.setClearColor(backgroundColor)} // 背景色設定の別方法
      >
        {/* ライト設定 */}
        <ambientLight intensity={0.7} /> {/* 環境光を少し強く */}
        <directionalLight
            position={[mazePhysicalSize * 0.5, mazePhysicalSize, mazePhysicalSize * 0.5]} // 光源の位置を迷路サイズに連動させる
            intensity={1.0} // 主光源の強度
            castShadow // 影を生成
            shadow-mapSize-width={1024} // 影の解像度
            shadow-mapSize-height={1024}
            shadow-camera-far={mazePhysicalSize * 3}
            shadow-camera-left={-mazePhysicalSize}
            shadow-camera-right={mazePhysicalSize}
            shadow-camera-top={mazePhysicalSize}
            shadow-camera-bottom={-mazePhysicalSize}
        />
        <directionalLight position={[-5, -5, -5]} intensity={0.3} /> {/* 補助光 */}

        {/* 迷路 */}
        <group position={[0, 0, 0]}> {/* 迷路全体をグループ化 */}
            <Maze mazeData={mazeData} />
        </group>


        {/* マウス */}
        {currentMouseState && <Mouse mouseState={currentMouseState} mazeSize={mazeSize}/>}

        {/* ヘルパー */}
        {/* GridHelper を primitive でラップ */}
        {showGridHelper && (
            <primitive
                object={new THREE.GridHelper(mazePhysicalSize, mazeSize, '#888888', '#bbbbbb')}
                position={[0, FLOOR_THICKNESS / 2, 0]}
            />
        )}
        {/* AxesHelper を primitive でラップ */}
        {showAxesHelper && (
            <primitive
                object={new THREE.AxesHelper(mazePhysicalSize * 0.6)}
                position={[0, FLOOR_THICKNESS / 2 + 0.01, 0]}
            />
        )}

        {/* カメラコントロール */}
        <CameraController initialViewPreset={initialViewPreset} mazeSize={mazeSize} />

      </Canvas>
    </div>
  );
};

export default MicromouseVisualizer;