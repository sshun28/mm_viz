import React, { useMemo } from 'react';
import * as THREE from 'three';
import { MouseState } from '../../types';
import { MOUSE_SIZE, FLOOR_THICKNESS } from '../../config/constants';

// マウス描画コンポーネント
const Mouse: React.FC<{ mouseState: MouseState }> = ({ mouseState }) => {
    // mazeSize パラメータは不要になったので削除

    // MouseState.position は迷路原点(左下隅)からの物理座標なので、そのまま使用できる
    const posX = mouseState.position.x;
    const posY = mouseState.position.y;
    const posZ = MOUSE_SIZE / 2 + FLOOR_THICKNESS / 2; // Z座標 (高さ)

    // 角度をThree.jsの回転（Z軸周り）に変換
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
    <group position={[posX, posY, posZ]} rotation={[0, 0, rotationZ]}>
      {/* 仮のBox形状 */}
      <mesh>
        <boxGeometry args={[MOUSE_SIZE, MOUSE_SIZE, MOUSE_SIZE]} />
        <meshStandardMaterial color="blue" />
      </mesh>
      {/* 向きを示すための矢印ヘルパー */}
      <primitive object={arrowHelper} />
    </group>
  );
};

export default Mouse;
