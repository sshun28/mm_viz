import React, { useRef, useEffect, useCallback } from 'react';
import { useThree, RootState } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { cameraPresets, CELL_SIZE } from '../../config/constants';
import { CameraViewPreset } from '../../types';

// カメラコントロール用コンポーネント
const CameraController: React.FC<{
  initialViewPreset?: CameraViewPreset;
  mazeSize?: number;
}> = ({ initialViewPreset = 'angle', mazeSize = 16 }) => { // 戻り値の型注釈を削除
  const { camera, controls: controlsFromHook } = useThree<RootState>();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const mazeCenterRef = useRef<THREE.Vector3>(
    new THREE.Vector3(mazeSize * CELL_SIZE / 2, mazeSize * CELL_SIZE / 2, 0)
  );

  // Z-up設定
  useEffect(() => {
    camera.up.set(0, 0, 1);
    const currentControls = controlsRef.current || controlsFromHook;
    if (currentControls) {
        if ('target' in currentControls && typeof (currentControls as any).target?.set === 'function') {
            (currentControls as any).target.set(
              mazeCenterRef.current.x, 
              mazeCenterRef.current.y, 
              0
            ); // Z座標を0に固定
        }
        if (typeof (currentControls as any).update === 'function') {
            (currentControls as any).update();
        }
    }
  }, [camera, controlsFromHook]);

  // Define distanceFactor based on maze size
  const distanceFactor = mazeSize * CELL_SIZE * 1.5;

  const setCameraView = useCallback((presetKey: CameraViewPreset) => {
    // Correct the camera preset positions to ensure accurate alignment
    const preset = cameraPresets[presetKey];
    const mazeCenterOffset = mazeSize * CELL_SIZE / 2;
    let adjustedPosition;

    if (presetKey === 'top') {
      adjustedPosition = new THREE.Vector3(mazeCenterOffset, mazeCenterOffset, mazeSize * CELL_SIZE * 1.5); // Directly above the maze
    } else if (presetKey === 'side') {
      adjustedPosition = new THREE.Vector3(mazeCenterOffset, -mazeSize * CELL_SIZE * 1.5, mazeCenterOffset); // Side view
    } else {
      adjustedPosition = new THREE.Vector3(...preset.position)
        .add(new THREE.Vector3(mazeCenterOffset, mazeCenterOffset, 0))
        .normalize()
        .multiplyScalar(distanceFactor);
    }
    // Update the camera target to the maze center
    const target = new THREE.Vector3(mazeSize * CELL_SIZE / 2, mazeSize * CELL_SIZE / 2, 0);
    mazeCenterRef.current = target.clone();

    camera.position.copy(adjustedPosition);

    const currentControls = controlsRef.current || controlsFromHook;
    if (currentControls) {
        if ('target' in currentControls && typeof (currentControls as any).target?.copy === 'function') {
            (currentControls as any).target.copy(target);
        }
        if (typeof (currentControls as any).update === 'function') {
            (currentControls as any).update();
        }
    }
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  }, [camera, controlsFromHook, mazeSize]);

  useEffect(() => {
    setCameraView(initialViewPreset);
     const currentControls = controlsRef.current || controlsFromHook;
     if (currentControls && typeof (currentControls as any).update === 'function') {
        (currentControls as any).update();
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialViewPreset, setCameraView]);

  // カメラリセット機能
  const resetCamera = useCallback((presetKey: CameraViewPreset = initialViewPreset) => {
    setCameraView(presetKey);
  }, [initialViewPreset, setCameraView]);

  // キーボードイベントリスナー
  useEffect(() => {
    // handleKeyDown を useEffect 内で定義
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.key) return;

      const key = event.key.toLowerCase();
      if (key === 'r') {
        resetCamera();
      } else if (key === '1') {
        setCameraView('top');
      } else if (key === '2') {
        setCameraView('angle');
      } else if (key === '3') {
        setCameraView('side');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    // クリーンアップ関数内で handleKeyDown を参照
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetCamera, setCameraView]); // resetCamera と setCameraView を依存配列に追加

  // ターゲット座標のZ値を0に固定するためのハンドラ
  const handleControlChange = useCallback(() => {
    const currentControls = controlsRef.current;
    if (currentControls && 'target' in currentControls) {
      (currentControls as any).target.z = 0;
    }
  }, []);

  return (
    <OrbitControls 
      ref={controlsRef} 
      onChange={handleControlChange}
      makeDefault
    />
  );
};

export default CameraController;
