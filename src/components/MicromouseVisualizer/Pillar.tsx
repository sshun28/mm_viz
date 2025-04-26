import React, { useMemo } from 'react';
import { useFBX, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { PILLAR_COLOR } from '../../config/constants';

// 柱のプロパティの型定義
export interface PillarProps {
    position: [number, number, number];  // 柱の位置
    rotation?: [number, number, number]; // 柱の回転角（オプション）
}

// 単一のPillarの描画用コンポーネント - 従来のコード互換性のために維持
const Pillar: React.FC<PillarProps> = ({
    position,
    rotation = [0, 0, 0],
}) => {
    // 単一インスタンスでは、柱のインスタンス化はPillarInstancesコンポーネントで行われるため、
    // 空のグループを返します。これはMazeコンポーネントからの互換性のために残しています。
    return null;
};

// インスタンス化された柱のプロパティ
export interface PillarInstancesProps {
    positions: [number, number, number][]; // 複数の柱の位置
}

/**
 * 複数の柱をインスタンス化して効率的に描画するコンポーネント
 * @react-three/dreiのInstances/Instanceを使用してさらに簡潔に実装
 */
export const PillarInstances: React.FC<PillarInstancesProps> = ({ positions }) => {
    // FBXモデルを読み込む
    const fbx = useFBX('/3d_models/pillar.fbx');
    
    // FBXモデルからジオメトリとマテリアルの配列を抽出
    const meshes = useMemo(() => {
        if (!fbx) return [];
        
        const result: { geometry: THREE.BufferGeometry; material: THREE.Material }[] = [];
        
        // FBXの座標系をThree.jsの座標系に変換するための回転を適用したクローンを作成
        const modelClone = fbx.clone(true);
        
        // デフォルトのマテリアルを準備
        const defaultMaterial = new THREE.MeshStandardMaterial({
            color: PILLAR_COLOR,
            roughness: 0.5,
            metalness: 0.3,
        });
        
        // FBXモデル内のすべてのメッシュを処理
        modelClone.traverse((child) => {
            if (child instanceof THREE.Mesh && child.geometry) {
                // ジオメトリの準備
                const geometry = child.geometry.clone();
                geometry.computeBoundingSphere();
                geometry.computeBoundingBox();
                geometry.computeVertexNormals();
                
                // マテリアルの準備
                // もしマテリアルが配列の場合は、各マテリアルに対して別々のインスタンスを作成する必要がある
                if (Array.isArray(child.material)) {
                    child.material.forEach((mat, index) => {
                        // 各サブマテリアルに対してジオメトリをクローンして登録
                        if (mat) {
                            result.push({ 
                                geometry: geometry.clone(), 
                                material: mat.clone() 
                            });
                        }
                    });
                } else {
                    // 単一マテリアルの場合
                    const material = child.material ? child.material.clone() : defaultMaterial.clone();
                    result.push({ geometry, material });
                }
            }
        });
        
        return result;
    }, [fbx]);
    
    return (
        <>
            {meshes.map((mesh, meshIndex) => (
                <Instances 
                    key={`pillar-instances-${meshIndex}`}
                    geometry={mesh.geometry}
                    material={mesh.material}
                    limit={positions.length} // インスタンスの最大数
                    range={positions.length} // 実際に表示するインスタンス数
                    castShadow
                    receiveShadow
                >
                    {positions.map((position, i) => (
                        <Instance 
                            key={`pillar-instance-${i}`}
                            position={position}
                            scale={[0.01, 0.01, 0.01]} // スケールを調整
                            rotation={[Math.PI/2, 0, 0]} // 回転を適用
                        />
                    ))}
                </Instances>
            ))}
        </>
    );
};

export default Pillar;