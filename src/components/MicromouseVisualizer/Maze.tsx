import React from 'react';
import * as THREE from 'three';
import { MazeData } from '../../types';
import { 
    CELL_SIZE, 
    WALL_HEIGHT, 
    WALL_THICKNESS, 
    FLOOR_THICKNESS, 
    PILLAR_SIZE, 
    PILLAR_HEIGHT, 
    PILLAR_COLOR 
} from '../../config/constants';

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

export default Maze;
