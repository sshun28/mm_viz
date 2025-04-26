import React from 'react';
import * as THREE from 'three';
import { MazeData } from '../../types';
import { 
    CELL_SIZE, 
    FLOOR_THICKNESS, 
} from '../../config/constants';
import Wall from './Wall';
import Pillar, { PillarInstances } from './Pillar';

// 迷路描画コンポーネント
const Maze: React.FC<{ mazeData: MazeData }> = ({ mazeData }) => {
  const { size, walls } = mazeData;
  const mazeWidth = size * CELL_SIZE;
  const mazeDepth = size * CELL_SIZE; // Y方向のサイズだが変数名はDepthのまま

  // 床 (X-Y平面に配置) - 迷路全体に加えて全方向に1マスずつ大きくする
  const extendedMazeWidth = (size + 2) * CELL_SIZE; // 横方向に両側1マスずつ拡張
  const extendedMazeDepth = (size + 2) * CELL_SIZE; // 縦方向に両側1マスずつ拡張
  
  // 床の位置を調整 - 原点が左下のまま床全体が広がるように
  const floorPosX = mazeWidth / 2; // 元の迷路の中心X座標
  const floorPosY = mazeDepth / 2; // 元の迷路の中心Y座標
  
  const floor = (
    <mesh position={[floorPosX, floorPosY, -FLOOR_THICKNESS / 2]} rotation={[0, 0, 0]}>
      <boxGeometry args={[extendedMazeWidth, extendedMazeDepth, FLOOR_THICKNESS]} />
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
        wallElements.push(
          <Wall 
            key={`vwall-${y}-${x}`} 
            position={[posX, posY, 0]}
            rotation={[0, 0, Math.PI / 2]} // 垂直壁は90度回転
          />
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
        wallElements.push(
          <Wall 
            key={`hwall-${y}-${x}`} 
            position={[posX, posY, 0]}
            rotation={[0, 0, 0]} // 水平壁は回転なし
          />
        );
      }
    }
  }

  // 柱の位置情報を収集
  const pillarPositions: [number, number, number][] = [];
  // 柱は (size + 1) x (size + 1) 個配置される
  for (let y = 0; y < size + 1; y++) {
    for (let x = 0; x < size + 1; x++) {
      // 柱の中心座標を計算（オフセットなし）
      const posX = x * CELL_SIZE; // X座標（グリッドライン上）
      const posY = y * CELL_SIZE; // Y座標（グリッドライン上）
      pillarPositions.push([posX, posY, 0]);
    }
  }

  return (
    <group>
      {floor}
      {wallElements}
      <PillarInstances positions={pillarPositions} />
    </group>
  );
};

export default Maze;
