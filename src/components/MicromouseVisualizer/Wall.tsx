import React, { useEffect, useRef, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { useFBX, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { getModelPath } from '../../assets/models';

// 壁のプロパティの型定義
export interface WallProps {
  position: [number, number, number];  // 壁の位置
  rotation?: [number, number, number]; // 壁の回転角（オプション）
  scale?: [number, number, number];    // 壁のスケール（オプション）
}

/**
 * FBXファイルから壁のモデルを読み込むコンポーネント
 * 単一の壁を描画するための従来のコンポーネント - 互換性のために維持
 */
const Wall: React.FC<WallProps> = ({ 
  position, 
  rotation = [0, 0, 0],
  scale = [1, 1, 1]
}) => {
  // FBXモデルを読み込む
  const fbx = useFBX(getModelPath('wall'));
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

// インスタンス化された壁のプロパティ
export interface WallInstancesProps {
  walls: {
    position: [number, number, number];
    rotation?: [number, number, number];
  }[];
}

/**
 * 複数の壁をインスタンス化して効率的に描画するコンポーネント
 * @react-three/dreiのInstances/Instanceを使用
 */
export const WallInstances: React.FC<WallInstancesProps> = ({ walls }) => {
  // FBXモデルを読み込む
  const fbx = useFBX(getModelPath('wall'));
  const { scene } = useThree();
  
  // モデルの基本的なジオメトリとマテリアルを抽出
  const { geometries, materials } = useMemo(() => {
    if (!fbx) return { geometries: [], materials: [] };
    
    const extractedGeometries: THREE.BufferGeometry[] = [];
    const extractedMaterials: THREE.Material[] = [];
    
    // デフォルトのマテリアルを準備
    const defaultMaterial = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.5,
      metalness: 0.2,
    });
    
    // FBXモデル内のメッシュを処理
    fbx.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        // ジオメトリの準備
        const geometry = child.geometry.clone();
        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();
        geometry.computeVertexNormals();
        
        // マテリアルの準備
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            if (mat) {
              const clonedMat = mat.clone();
              clonedMat.needsUpdate = true;
              extractedMaterials.push(clonedMat);
              extractedGeometries.push(geometry.clone());
            }
          });
        } else {
          const material = child.material 
            ? child.material.clone() 
            : defaultMaterial.clone();
          
          material.needsUpdate = true;
          extractedMaterials.push(material);
          extractedGeometries.push(geometry);
        }
      }
    });
    
    return { 
      geometries: extractedGeometries, 
      materials: extractedMaterials 
    };
  }, [fbx]);
  
  // モデルが読み込まれていない場合は早期リターン
  if (geometries.length === 0 || walls.length === 0) {
    return null;
  }
  
  return (
    <>
      {geometries.map((geometry, index) => (
        <Instances 
          key={`wall-instances-${index}`}
          geometry={geometry}
          material={materials[index]}
          limit={walls.length}
          range={walls.length}
          castShadow
          receiveShadow
        >
          {walls.map((wall, i) => {
            // 回転を設定（X軸回りに90度回転を基本とし、wall.rotationの値を適用）
            let rotX = Math.PI / 2;
            let rotY = 0;
            let rotZ = 0;
            
            if (wall.rotation) {
              rotY = wall.rotation[1];
              rotZ = wall.rotation[2];
            }
            
            // デフォルトのスケール
            const defaultScale: [number, number, number] = [0.01, 0.01, 0.01];
            
            return (
              <Instance 
                key={`wall-instance-${i}`}
                position={wall.position}
                rotation={[rotX, rotY, rotZ]}
                scale={defaultScale}
              />
            );
          })}
        </Instances>
      ))}
    </>
  );
};

export default Wall;