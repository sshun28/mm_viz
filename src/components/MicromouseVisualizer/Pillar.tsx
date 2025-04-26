import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useFBX } from '@react-three/drei';
import * as THREE from 'three';
import { PILLAR_COLOR } from '../../config/constants';

// 柱のプロパティの型定義
export interface PillarProps {
    position: [number, number, number];  // 柱の位置
    rotation?: [number, number, number]; // 柱の回転角（オプション）
}

/**
 * FBXファイルから柱のモデルを読み込むコンポーネント
 */
const Pillar: React.FC<PillarProps> = ({
    position,
    rotation = [0, 0, 0],
}) => {
    // FBXモデルを読み込む
    const fbx = useFBX('/3d_models/pillar.fbx');
    const pillarRef = useRef<THREE.Group>(null);
    const { scene } = useThree();

    // モデルのマテリアルを設定
    useEffect(() => {
        if (fbx) {
            // ディープクローンを作成して完全なコピーを確保
            const modelClone = fbx.clone(true);

            // FBXの座標系（Yが上）をThree.jsの座標系（Zが上）に変換するための回転
            modelClone.rotation.x = Math.PI / 2;
            modelClone.scale.set(0.001, 0.001, 0.001); // FBXのスケールを調整
            
            // デフォルトのマテリアルを準備（必要に応じて使用）
            const defaultMaterial = new THREE.MeshStandardMaterial({
                color: PILLAR_COLOR,
                roughness: 0.5,
                metalness: 0.3,
            });

            // モデル内のすべてのメッシュを処理
            modelClone.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    // 1. メッシュのマテリアルを確認
                    if (!child.material) {
                        // マテリアルがない場合はデフォルトマテリアルを適用
                        child.material = defaultMaterial.clone();
                    } 
                    // 2. マテリアル配列の場合
                    else if (Array.isArray(child.material)) {
                        // 無効なマテリアルがあれば置き換え
                        for (let i = 0; i < child.material.length; i++) {
                            if (!child.material[i]) {
                                child.material[i] = defaultMaterial.clone();
                            } else {
                                // 既存マテリアルの更新フラグを設定
                                child.material[i].needsUpdate = true;
                                const m = child.material[i]
                            }
                        }
                    } 
                    // 3. 単一マテリアルの場合
                    else {
                        // 既存マテリアルの更新フラグを設定
                        child.material.needsUpdate = true;
                    }

                    // シャドウの設定
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // ジオメトリが存在すればバッファを更新
                    if (child.geometry) {
                        // バッファを更新
                        child.geometry.computeBoundingSphere();
                        child.geometry.computeBoundingBox();
                        child.geometry.computeVertexNormals();
                    }
                }
            });

            // 既存の子要素をクリアしてクローンを追加
            if (pillarRef.current) {
                while (pillarRef.current.children.length > 0) {
                    pillarRef.current.remove(pillarRef.current.children[0]);
                }
                pillarRef.current.add(modelClone);
            }
        }
    }, [fbx]);

    return (
        <group
            ref={pillarRef}
            position={position}
            rotation={rotation}
        />
    );
};

/**
 * FBXモデルの詳細情報を収集するヘルパー関数
 */
function getFBXDetails(model: THREE.Group): any {
    const details = {
        name: model.name,
        type: model.type,
        childrenCount: model.children.length,
        materials: [] as any[],
        meshes: [] as any[]
    };

    // モデル内のマテリアルとメッシュに関する情報を収集
    model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            const meshInfo = {
                name: child.name,
                materialType: 'なし'
            };
            
            if (child.material) {
                if (Array.isArray(child.material)) {
                    meshInfo.materialType = `配列（${child.material.length}個）`;
                    details.materials.push(...child.material.map(mat => ({
                        name: mat ? mat.name : 'なし',
                        type: mat ? mat.type : 'なし',
                        color: mat && 'color' in mat ? mat.color : 'なし'
                    })));
                } else {
                    meshInfo.materialType = child.material.type;
                    details.materials.push({
                        name: child.material.name,
                        type: child.material.type,
                        color: 'color' in child.material ? child.material.color : 'なし'
                    });
                }
            }
            
            details.meshes.push(meshInfo);
        }
    });

    return details;
}

export default Pillar;