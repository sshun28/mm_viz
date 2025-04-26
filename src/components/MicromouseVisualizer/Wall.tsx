import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useFBX } from '@react-three/drei';
import * as THREE from 'three';
import { WALL_THICKNESS } from '../../config/constants';

// 壁のプロパティの型定義
export interface WallProps {
  position: [number, number, number];  // 壁の位置
  rotation?: [number, number, number]; // 壁の回転角（オプション）
  scale?: [number, number, number];    // 壁のスケール（オプション）
}

/**
 * FBXファイルから壁のモデルを読み込むコンポーネント
 */
const Wall: React.FC<WallProps> = ({ 
  position, 
  rotation = [0, 0, 0],
  scale = [1, 1, 1]
}) => {
  // FBXモデルを読み込む
  const fbx = useFBX('/3d_models/wall.fbx');
  const wallRef = useRef<THREE.Group>(null);
  const { scene } = useThree();
  
  // モデルのマテリアルを設定
  useEffect(() => {
    if (fbx) {
      // クローンを作成
      const modelClone = fbx.clone();
      
      // FBXの座標系（Yが上）をThree.jsの座標系（Zが上）に変換するための回転
      modelClone.rotation.x = Math.PI / 2;
      modelClone.scale.set(0.001, 0.001, 0.001); // FBXのスケールを調整
      
      // すべてのメッシュにFBXから読み出したマテリアルを適用
      modelClone.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // マテリアルの確認とシャドウ設定
          if (child.material) {
            // マテリアルが配列の場合
            if (Array.isArray(child.material)) {
              // 各マテリアルに対してシャドウ設定を適用
              child.material.forEach(mat => {
                if (mat) {
                  // シャドウ設定
                  mat.needsUpdate = true;
                }
              });
            } else {
              // 単一マテリアルの場合
              child.material.needsUpdate = true;
            }
          } else {
            // マテリアルがない場合はデフォルトマテリアルを作成
            child.material = new THREE.MeshStandardMaterial({
              color: '#ffffff',  // 白色
              roughness: 0.5,    // 表面の粗さ
              metalness: 0.2,    // 金属感
            });
          }
          
          // シャドウの設定
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // 既存の子要素をクリアしてクローンを追加
      if (wallRef.current) {
        while (wallRef.current.children.length > 0) {
          wallRef.current.remove(wallRef.current.children[0]);
        }
        wallRef.current.add(modelClone);
      }
    }
  }, [fbx]);

  return (
    <group 
      ref={wallRef} 
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
};

export default Wall;