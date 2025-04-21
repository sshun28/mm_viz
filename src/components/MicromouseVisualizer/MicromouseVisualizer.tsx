import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useHelper } from '@react-three/drei';
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
const PILLAR_SIZE = WALL_THICKNESS * 1.2; // 柱のサイズ (壁より少し太く)
const PILLAR_HEIGHT = WALL_HEIGHT; // 柱の高さ (壁と同じ)
const PILLAR_COLOR = '#aaaaaa'; // 柱の色

// --- カメラプリセット ---
// 座標系: Zが上、Xが右、Yが奥 (右手系)
const cameraPresets = {
  top: { position: [0, 0, 10], target: [0, 0, 0] }, // 真上から (Z軸プラス方向から)
  angle: { position: [5, -5, 5], target: [0, 0, 0] }, // 斜め上から (Y軸マイナス方向から見る)
  side: { position: [5, 0, 1], target: [0, 0, 0] }, // 横から (X軸プラス方向から)
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

  // Z-up設定
  useEffect(() => {
    camera.up.set(0, 0, 1);
  }, [camera]);


  const setCameraView = (presetKey: 'top' | 'angle' | 'side') => {
    const preset = cameraPresets[presetKey];
    // 迷路サイズに基づいてカメラ位置を調整
    const mazePhysicalSize = mazeSize * CELL_SIZE;
    // Z-upに合わせて調整
    const distanceFactor = presetKey === 'top' ? Math.max(5, mazePhysicalSize * 1.2) : Math.max(5, mazePhysicalSize * 1.5);
    const adjustedPosition = new THREE.Vector3(...preset.position).normalize().multiplyScalar(distanceFactor);
    const target = new THREE.Vector3(...preset.target); // ターゲットは常に中心(0,0,0)

    camera.position.copy(adjustedPosition);
    // camera.up.set(0, 0, 1); // useEffectで設定済みだが念のため

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
     // Z-up設定を反映させるためにcontrolsも更新
     if (controlsRef.current) {
        controlsRef.current.update();
     } else if (controls) {
        // @ts-ignore
        controls.update();
     }
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
  const mazeDepth = size * CELL_SIZE; // Y方向のサイズだが変数名はDepthのまま
  // 座標系の中心を(0,0,0)にするためのオフセット
  // Three.js空間: X軸が右、Y軸が奥、Z軸が上
  // 迷路座標: (0,0)が左手前 (Xが増えると右、Yが増えると奥)
  // 変換: Three.js X = (迷路X + 0.5) * CELL_SIZE - mazeWidth / 2
  //       Three.js Y = (迷路Y + 0.5) * CELL_SIZE - mazeDepth / 2
  //       Three.js Z = 高さ
  const offsetX = -mazeWidth / 2 + CELL_SIZE / 2;
  const offsetY = -mazeDepth / 2 + CELL_SIZE / 2; // Y軸方向のオフセット

  // 床 (X-Y平面に配置)
  const floor = (
    <mesh position={[0, 0, -FLOOR_THICKNESS / 2]} rotation={[0, 0, 0]}>
      {/* 床面をPlaneGeometryからBoxGeometryに変更して厚みを持たせる */}
      <boxGeometry args={[mazeWidth, mazeDepth, FLOOR_THICKNESS]} />
      <meshStandardMaterial color="#333333" side={THREE.DoubleSide} />
    </mesh>
  );

  // 壁
  const wallElements: React.ReactNode[] = [];
  // 垂直壁 (vwall[y][x] はマス(x,y)の左の壁 = X軸に平行な壁)
  for (let y = 0; y < size; y++) {
    // xは0からsizeまで（size+1列）
    for (let x = 0; x < size + 1; x++) {
      if (walls.vwall[y]?.[x]) { // 存在チェック
        // 壁の中心座標を計算
        const posX = offsetX + x * CELL_SIZE - CELL_SIZE / 2; // X座標
        const posY = offsetY + y * CELL_SIZE; // Y座標
        const posZ = WALL_HEIGHT / 2; // Z座標 (高さの中心)
        wallElements.push(
          <mesh key={`vwall-${y}-${x}`} position={[posX, posY, posZ]}>
            {/* 壁ジオメトリ: 厚み(X方向), 長さ(Y方向), 高さ(Z方向) */}
            <boxGeometry args={[WALL_THICKNESS, CELL_SIZE, WALL_HEIGHT]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        );
      }
    }
  }
  // 水平壁 (hwall[y][x] はマス(x,y)の上の壁 = Y軸に平行な壁)
  // yは0からsizeまで（size+1行）
  for (let y = 0; y < size + 1; y++) {
    for (let x = 0; x < size; x++) {
      if (walls.hwall[y]?.[x]) { // 存在チェック
        // 壁の中心座標を計算
        const posX = offsetX + x * CELL_SIZE; // X座標
        const posY = offsetY + y * CELL_SIZE - CELL_SIZE / 2; // Y座標
        const posZ = WALL_HEIGHT / 2; // Z座標 (高さの中心)
        wallElements.push(
          <mesh key={`hwall-${y}-${x}`} position={[posX, posY, posZ]}>
             {/* 壁ジオメトリ: 長さ(X方向), 厚み(Y方向), 高さ(Z方向) */}
            <boxGeometry args={[CELL_SIZE, WALL_THICKNESS, WALL_HEIGHT]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        );
      }
    }
  }

  // 柱 (Pillars)
  const pillarElements: React.ReactNode[] = [];
  // 柱は (size + 1) x (size + 1) 個配置される
  for (let y = 0; y < size + 1; y++) {
    for (let x = 0; x < size + 1; x++) {
      // 柱の中心座標を計算 (壁の交点)
      const posX = offsetX + x * CELL_SIZE - CELL_SIZE / 2;
      const posY = offsetY + y * CELL_SIZE - CELL_SIZE / 2;
      const posZ = PILLAR_HEIGHT / 2; // Z座標 (高さの中心)
      pillarElements.push(
        <mesh key={`pillar-${y}-${x}`} position={[posX, posY, posZ]}>
          {/* 柱ジオメトリ: 幅(X), 奥行き(Y), 高さ(Z) */}
          <boxGeometry args={[PILLAR_SIZE, PILLAR_SIZE, PILLAR_HEIGHT]} />
          <meshStandardMaterial color={PILLAR_COLOR} />
        </mesh>
      );
    }
  }


  // スタート地点マーカー (X-Y平面に配置)
  const startMarker = (
    <mesh position={[offsetX + start.x * CELL_SIZE, offsetY + start.y * CELL_SIZE, FLOOR_THICKNESS / 2 + 0.001]} rotation={[0, 0, 0]}>
      <planeGeometry args={[CELL_SIZE * 0.8, CELL_SIZE * 0.8]} />
      <meshStandardMaterial color="green" side={THREE.DoubleSide} transparent opacity={0.7}/>
    </mesh>
  );

  // ゴール地点マーカー (X-Y平面に配置)
  const goalMarkers = goal.map((g, index) => (
    <mesh key={`goal-${index}`} position={[offsetX + g.x * CELL_SIZE, offsetY + g.y * CELL_SIZE, FLOOR_THICKNESS / 2 + 0.001]} rotation={[0, 0, 0]}>
       <planeGeometry args={[CELL_SIZE * 0.8, CELL_SIZE * 0.8]} />
       <meshStandardMaterial color="red" side={THREE.DoubleSide} transparent opacity={0.7}/>
    </mesh>
  ));


  return (
    <group>
      {floor}
      {wallElements}
      {pillarElements} {/* 柱を追加 */}
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
    const offsetY = -mazeDepth / 2 + CELL_SIZE / 2; // Y軸オフセット

    // 物理座標をThree.js座標に変換
    const posX = offsetX + mouseState.position.x * CELL_SIZE;
    const posY = offsetY + mouseState.position.y * CELL_SIZE; // Y座標をそのまま使用
    const posZ = MOUSE_SIZE / 2 + FLOOR_THICKNESS / 2; // Z座標 (高さ)

    // 角度をThree.jsの回転（Z軸周り）に変換
    // 設計角度: 0=East(+X), PI/2=North(+Y), PI=West(-X), 3PI/2=South(-Y)
    // Three.js Z回転: 0=+X(East), PI/2=+Y(North), PI=-X(West), 3PI/2=-Y(South)
    // 変換式: rotationZ = angle
    const rotationZ = mouseState.angle;


  return (
    <mesh position={[posX, posY, posZ]} rotation={[0, 0, rotationZ]}>
      {/* 仮のBox形状 */}
      <boxGeometry args={[MOUSE_SIZE, MOUSE_SIZE, MOUSE_SIZE]} />
      <meshStandardMaterial color="blue" />
       {/* 向きを示すための矢印ヘルパー (ローカルX+方向を向く) */}
       <arrowHelper args={[new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), MOUSE_SIZE * 0.8, 0xffff00, MOUSE_SIZE * 0.3, MOUSE_SIZE * 0.2]} />
    </mesh>
  );
};


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
  // デフォルトのマウス状態 (北向き: angle = PI/2)
  const defaultMouseState: MouseState = {
    position: { x: mazeData?.start?.x ?? 0, y: mazeData?.start?.y ?? 0 }, // スタート地点をデフォルトに
    angle: Math.PI / 2, // 北向き (+Y方向)
  };

  // useStateの初期値に、propで渡された値 || デフォルト値 を使用
  const [currentMouseState, setCurrentMouseState] = useState<MouseState>(
     initialMouseState ?? defaultMouseState
  );

  // Propsの変更を監視して内部状態を更新
  useEffect(() => {
    // initialMouseStateが変更されたら内部状態も更新
    // ただし、undefinedの場合はデフォルト値を使用する
    // mazeDataが変更された場合も、デフォルト位置を更新する必要があるため、
    // defaultMouseStateのpositionも更新するようにする
    const effectiveInitialState = initialMouseState ?? {
        position: { x: mazeData?.start?.x ?? 0, y: mazeData?.start?.y ?? 0 },
        angle: Math.PI / 2, // 北向き (+Y方向)
    };
    setCurrentMouseState(effectiveInitialState);
  }, [initialMouseState, mazeData]); // mazeDataも依存配列に追加

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
    <div style={{ width, height }} className="micromouse-visualizer-container">
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
                position={[0, 0, FLOOR_THICKNESS / 2]} // Z座標を設定
            />
        )}
        {showAxesHelper && (
            <primitive
                object={new THREE.AxesHelper(mazePhysicalSize * 0.6)}
                // Zが上になるように回転は不要
                position={[0, 0, FLOOR_THICKNESS / 2 + 0.01]} // Z座標を設定
            />
        )}

        {/* カメラコントロール */}
        <CameraController initialViewPreset={initialViewPreset} mazeSize={mazeSize} />

      </Canvas>
    </div>
  );
};

export default MicromouseVisualizer;