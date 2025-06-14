import React, { useEffect, useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useFBX } from '@react-three/drei';
import * as THREE from 'three';
import { MouseState } from '../../types';
import { MOUSE_SIZE, FLOOR_THICKNESS } from '../../config/constants';
import { useData, useSharedTrajectoryAnimation } from '../../providers/DataProvider';
import { getModelPath } from '../../assets/models';

// マウスのプロパティの型定義
export interface MouseProps {
  mouseState?: MouseState;          // マウスの状態（位置と角度）- DataProviderから取得する場合はオプション
  fbxPath?: string;                 // FBXファイルのパス（オプション）
  scale?: [number, number, number]; // モデルのスケール（オプション）
  modelColor?: string;              // モデルの色（オプション）
  showArrowHelper?: boolean;        // 向きを示す矢印の表示/非表示（オプション）
  modelOffset?: {                   // モデルのオフセット調整（オプション）
    position?: [number, number, number];
    rotation?: [number, number, number];
  };
}

/**
 * FBXファイルからマウスのモデルを読み込むコンポーネント
 */
const Mouse: React.FC<MouseProps> = ({
  mouseState: propMouseState,
  fbxPath = getModelPath('micromouse'),
  scale = [0.001, 0.001, 0.001],
  modelColor,
  showArrowHelper = true,
  modelOffset = {
    position: [0, 0, 0],
    rotation: [Math.PI / 2, Math.PI / 2, 0], // デフォルトはFBXの座標系（Yが上）をThree.jsの座標系（Zが上）に変換
  }
}) => {
  console.log('Mouse component rendered');
  const dataMouseState = useData((state) => state.mouseState);
  const isPlaying = useData((state) => state.isPlaying);
  const trajectoryProfile = useData((state) => state.trajectoryProfile);
  
  // 高性能アニメーション用のref管理（共有）
  const { currentMouseStateRef } = useSharedTrajectoryAnimation();

  // 初期マウス状態（ストーリーやデフォルト用）
  const staticMouseState = propMouseState || dataMouseState;

  // FBXモデルを読み込む
  const fbx = useFBX(fbxPath);
  const mouseRef = useRef<THREE.Group>(null);
  const { scene } = useThree();

  // ArrowHelper を useMemo で作成（向きを示す矢印）
  const arrowHelper = useMemo(() => {
    const dir = new THREE.Vector3(1, 0, 0); // ローカルX軸方向
    const origin = new THREE.Vector3(0, 0, 0); // メッシュの中心
    const length = MOUSE_SIZE * 0.8;
    const hex = 0xffff00; // 黄色
    const headLength = MOUSE_SIZE * 0.4;
    const headWidth = MOUSE_SIZE * 0.2;
    return new THREE.ArrowHelper(dir, origin, length, hex, headLength, headWidth);
  }, []);

  // モデルのマテリアルを設定
  useEffect(() => {
    if (fbx) {
      // クローンを作成
      const modelClone = fbx.clone();

      // モデルのオフセット調整
      if (modelOffset.position) {
        modelClone.position.set(...modelOffset.position);
      }

      if (modelOffset.rotation) {
        modelClone.rotation.set(...modelOffset.rotation);
      }

      // スケールを設定
      modelClone.scale.set(...scale);

      // すべてのメッシュにマテリアルを適用
      modelClone.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // カスタムカラーが指定されている場合は適用
          if (modelColor) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                if (mat) {
                  mat.color.set(modelColor);
                  mat.needsUpdate = true;
                }
              });
            } else if (child.material) {
              child.material.color.set(modelColor);
              child.material.needsUpdate = true;
            }
          } else if (!child.material) {
            // マテリアルがない場合はデフォルトマテリアルを作成
            child.material = new THREE.MeshStandardMaterial({
              color: '#0066cc',  // 青色
              roughness: 0.5,    // 表面の粗さ
              metalness: 0.3,    // 金属感
            });
          }

          // シャドウの設定
          child.castShadow = true;
          child.receiveShadow = true;

          // ジオメトリが存在すればバッファを更新
          if (child.geometry) {
            child.geometry.computeBoundingSphere();
            child.geometry.computeBoundingBox();
            child.geometry.computeVertexNormals();
          }
        }
      });

      // 既存の子要素をクリアしてクローンを追加
      if (mouseRef.current) {
        while (mouseRef.current.children.length > 0) {
          mouseRef.current.remove(mouseRef.current.children[0]);
        }
        mouseRef.current.add(modelClone);

        // 矢印ヘルパーを追加（表示オプションがtrueの場合）
        if (showArrowHelper) {
          mouseRef.current.add(arrowHelper);
        }
      }
    }
  }, [fbx, modelColor, scale, modelOffset, showArrowHelper, arrowHelper]);

  // 初期位置の設定
  useEffect(() => {
    if (mouseRef.current && staticMouseState) {
      mouseRef.current.position.set(staticMouseState.position.x, staticMouseState.position.y, 0);
      mouseRef.current.rotation.set(0, 0, staticMouseState.angle);
      console.log('Initial mouse position set:', staticMouseState);
    }
  }, [staticMouseState]);

  useFrame(() => {
    if (!mouseRef.current) return;
    
    // 軌道アニメーション関連の状態がある場合は、再生中・一時停止中問わずrefベースを優先
    // 軌道データがない場合のみstaticMouseStateを使用
    let currentMouseState: MouseState;
    
    // 軌道プロファイルが存在し、かつrefに有効な状態があるかチェック
    const hasTrajectoryData = trajectoryProfile && trajectoryProfile.size > 0 && currentMouseStateRef.current;
    
    if (hasTrajectoryData) {
      // 軌道データがある場合：refベースの状態を使用（再生中・一時停止中問わず）
      currentMouseState = currentMouseStateRef.current;
    } else {
      // 軌道データがない場合：propsやZustandの状態を使用
      currentMouseState = staticMouseState;
    }
    
    if (!currentMouseState) {
      return;
    }
    
    const newX = currentMouseState.position.x;
    const newY = currentMouseState.position.y;
    const newAngle = currentMouseState.angle;
    
    mouseRef.current.position.set(newX, newY, 0);
    mouseRef.current.rotation.set(0, 0, newAngle);
  })

  return (
    <group
      ref={mouseRef}
      // position and rotation are managed dynamically in useFrame
    />
  );
};

export default Mouse;
