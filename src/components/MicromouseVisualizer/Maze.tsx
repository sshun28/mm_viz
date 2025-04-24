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
  
  // オフセット変数を削除 - 迷路の左下隅がシーンの原点(0,0,0)に来るようにする
  // const offsetX = -mazeWidth / 2 + CELL_SIZE / 2;
  // const offsetY = -mazeDepth / 2 + CELL_SIZE / 2;

  // 床 (X-Y平面に配置) - 迷路の中心に配置
  const floor = (
    <mesh position={[mazeWidth / 2, mazeDepth / 2, -FLOOR_THICKNESS / 2]} rotation={[0, 0, 0]}>
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
        // 壁の中心座標を計算（オフセットなし）
        const posX = x * CELL_SIZE; // X座標（グリッドライン上）
        const posY = y * CELL_SIZE + CELL_SIZE / 2; // Y座標（セルの中心）
        const posZ = WALL_HEIGHT / 2; // Z座標 (高さの中心)
        wallElements.push(
          <mesh key={`vwall-${y}-${x}`} position={[posX, posY, posZ]}>
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
        // 壁の中心座標を計算（オフセットなし）
        const posX = x * CELL_SIZE + CELL_SIZE / 2; // X座標（セルの中心）
        const posY = y * CELL_SIZE; // Y座標（グリッドライン上）
        const posZ = WALL_HEIGHT / 2; // Z座標 (高さの中心)
        wallElements.push(
          <mesh key={`hwall-${y}-${x}`} position={[posX, posY, posZ]}>
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
      // 柱の中心座標を計算（オフセットなし）
      const posX = x * CELL_SIZE; // X座標（グリッドライン上）
      const posY = y * CELL_SIZE; // Y座標（グリッドライン上）
      const posZ = PILLAR_HEIGHT / 2; // Z座標 (高さの中心)
      pillarElements.push(
        <mesh key={`pillar-${y}-${x}`} position={[posX, posY, posZ]}>
          <boxGeometry args={[PILLAR_SIZE, PILLAR_SIZE, PILLAR_HEIGHT]} />
          <meshStandardMaterial color={PILLAR_COLOR} />
        </mesh>
      );
    }
  }

  // スタート地点マーカー (X-Y平面に配置)
  const startMarker = (
    <mesh position={[start.x * CELL_SIZE + CELL_SIZE / 2, start.y * CELL_SIZE + CELL_SIZE / 2, FLOOR_THICKNESS / 2 + 0.001]} rotation={[0, 0, 0]}>
      <planeGeometry args={[CELL_SIZE * 0.8, CELL_SIZE * 0.8]} />
      <meshStandardMaterial color="green" side={THREE.DoubleSide} transparent opacity={0.7}/>
    </mesh>
  );

  // ゴール地点マーカー (X-Y平面に配置)
  const goalMarkers = goal.map((g, index) => (
    <mesh key={`goal-${index}`} position={[g.x * CELL_SIZE + CELL_SIZE / 2, g.y * CELL_SIZE + CELL_SIZE / 2, FLOOR_THICKNESS / 2 + 0.001]} rotation={[0, 0, 0]}>
       <planeGeometry args={[CELL_SIZE * 0.8, CELL_SIZE * 0.8]} />
       <meshStandardMaterial color="red" side={THREE.DoubleSide} transparent opacity={0.7}/>
    </mesh>
  ));

  return (
    <group>
      {floor}
      {wallElements}
      {pillarElements}
      {startMarker}
      {goalMarkers}
    </group>
  );
};

export default Maze;
