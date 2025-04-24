import React, { useMemo } from 'react';
import * as THREE from 'three';
import { MouseState } from '../../types';
import { CELL_SIZE, MOUSE_SIZE, FLOOR_THICKNESS } from '../../config/constants';

// マウス描画コンポーネント
const Mouse: React.FC<{ mouseState: MouseState; mazeSize: number }> = ({ mouseState, mazeSize }) => {
    // mazeSize はオフセット計算に必要なので残す
    const mazeWidth = mazeSize * CELL_SIZE;
    const mazeDepth = mazeSize * CELL_SIZE;
    const offsetX = -mazeWidth / 2 + CELL_SIZE / 2;
    const offsetY = -mazeDepth / 2 + CELL_SIZE / 2;

    // MouseState.position はすでに物理座標なので変換は不要
    // ただし、Three.js空間でのオフセットは適用する必要があるかもしれない
    // -> いや、MouseState.position自体がThree.js空間の物理座標(X,Y)を意図しているのでオフセットも不要
    const posX = mouseState.position.x;
    const posY = mouseState.position.y;
    const posZ = MOUSE_SIZE / 2 + FLOOR_THICKNESS / 2; // Z座標 (高さ)

    // 角度をThree.jsの回転（Z軸周り）に変換
    // 設計角度: 0=East(+X), PI/2=North(+Y), PI=West(-X), 3PI/2=South(-Y)
    // Three.js Z回転: 0=+X(East), PI/2=+Y(North), PI=-X(West), 3PI/2=-Y(South)
    // 変換式: rotationZ = angle
    const rotationZ = mouseState.angle;

    // ArrowHelper を useMemo で作成
    const arrowHelper = useMemo(() => {
        const dir = new THREE.Vector3(1, 0, 0); // ローカルX軸方向
        const origin = new THREE.Vector3(0, 0, 0); // メッシュの中心
        const length = MOUSE_SIZE * 0.8;
        const hex = 0xffff00; // 黄色
        const headLength = MOUSE_SIZE * 0.4;
        const headWidth = MOUSE_SIZE * 0.2;
        return new THREE.ArrowHelper(dir, origin, length, hex, headLength, headWidth);
    }, []); // MOUSE_SIZE が変更されない限り再生成しない

  return (
    <group position={[posX, posY, posZ]} rotation={[0, 0, rotationZ]}> {/* mesh を group に変更 */}
      {/* 仮のBox形状 */}
      <mesh> {/* Box を group 内の mesh に */}
        <boxGeometry args={[MOUSE_SIZE, MOUSE_SIZE, MOUSE_SIZE]} />
        <meshStandardMaterial color="blue" />
      </mesh>
      {/* 向きを示すための矢印ヘルパー */}
      <primitive object={arrowHelper} /> {/* primitive を使用 */}
    </group>
  );
};

export default Mouse;
