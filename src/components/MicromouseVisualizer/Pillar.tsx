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
            // クローンを作成してマテリアルを適用
            const modelClone = fbx.clone();

            // FBXの座標系（Yが上）をThree.jsの座標系（Zが上）に変換するための回転
            modelClone.rotation.x = Math.PI / 2;
            modelClone.scale.set(0.001, 0.001, 0.001);// FBXのスケールを調整

            // すべてのメッシュにマテリアルを適用
            modelClone.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    // マテリアルの設定
                    child.material = new THREE.MeshStandardMaterial({
                        color: PILLAR_COLOR,  // 定数から柱の色を使用
                        roughness: 0.5,       // 表面の粗さ
                        metalness: 0.3,       // 金属感
                    });

                    // シャドウの設定
                    child.castShadow = true;
                    child.receiveShadow = true;
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

export default Pillar;