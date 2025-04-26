import React, { useRef, useEffect, useCallback, useState } from 'react';
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
}> = ({ initialViewPreset = 'angle', mazeSize = 16 }) => {
  const { camera, controls: controlsFromHook, set, size } = useThree<RootState>();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const mazeCenterRef = useRef<THREE.Vector3>(
    new THREE.Vector3(mazeSize * CELL_SIZE / 2, mazeSize * CELL_SIZE / 2, 0)
  );
  const [isOrtho, setIsOrtho] = useState(false);

  // 迷路サイズからカメラのパラメータを計算
  const mazeWidth = mazeSize * CELL_SIZE;
  const mazeHeight = mazeSize * CELL_SIZE;
  const distanceFactor = mazeSize * CELL_SIZE * 1.5;

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

  // 直交投影カメラの設定を更新する関数
  const updateOrthographicCamera = useCallback((orthoCamera: THREE.OrthographicCamera) => {
    const aspect = size.width / size.height;
    if (aspect >= 1) {
      // 横長の場合
      orthoCamera.left = -mazeWidth;
      orthoCamera.right = mazeWidth;
      orthoCamera.top = mazeWidth / aspect;
      orthoCamera.bottom = -mazeWidth / aspect;
    } else {
      // 縦長の場合
      orthoCamera.left = -mazeHeight * aspect;
      orthoCamera.right = mazeHeight * aspect;
      orthoCamera.top = mazeHeight;
      orthoCamera.bottom = -mazeHeight;
    }
    orthoCamera.near = 0.1;
    orthoCamera.far = 1000;
    orthoCamera.updateProjectionMatrix();
  }, [mazeWidth, mazeHeight, size.width, size.height]);

  // 透視投影カメラの設定を更新する関数
  const updatePerspectiveCamera = useCallback((perspCamera: THREE.PerspectiveCamera) => {
    perspCamera.aspect = size.width / size.height;
    perspCamera.fov = 75;
    perspCamera.near = 0.1;
    perspCamera.far = 1000;
    perspCamera.updateProjectionMatrix();
  }, [size.width, size.height]);

  // 直交投影カメラに切り替える関数
  const enableOrthographicCamera = useCallback(() => {
    if (isOrtho) return; // 既に直交投影モードの場合は何もしない
    
    // 直交投影カメラの作成
    const orthoCamera = new THREE.OrthographicCamera();
    updateOrthographicCamera(orthoCamera);
    
    // 直交投影カメラは常に上面から見る位置に固定
    const mazeCenterOffset = mazeSize * CELL_SIZE / 2;
    orthoCamera.position.set(mazeCenterOffset, mazeCenterOffset, mazeSize * CELL_SIZE * 2);
    
    // 迷路の中心をターゲットとする
    const target = new THREE.Vector3(mazeCenterOffset, mazeCenterOffset, 0);
    orthoCamera.lookAt(target);
    
    // react-three-fiberのsetメソッドを使って新しいカメラを設定
    set({ camera: orthoCamera });
    
    // コントロールの更新
    const currentControls = controlsRef.current || controlsFromHook;
    if (currentControls) {
      if ('target' in currentControls && typeof (currentControls as any).target?.copy === 'function') {
        (currentControls as any).target.copy(target);
      }
      if (typeof (currentControls as any).update === 'function') {
        (currentControls as any).update();
      }
    }
    
    // 状態を更新
    setIsOrtho(true);
  }, [isOrtho, mazeSize, set, updateOrthographicCamera, controlsFromHook]);

  // 透視投影カメラに切り替える関数
  const enablePerspectiveCamera = useCallback(() => {
    if (!isOrtho) return; // 既に透視投影モードの場合は何もしない
    
    // 既存のカメラの位置と向きを保持
    const position = camera.position.clone();
    const quaternion = camera.quaternion.clone();
    const up = camera.up.clone();
    
    // 透視投影カメラの作成
    const perspCamera = new THREE.PerspectiveCamera();
    updatePerspectiveCamera(perspCamera);
    
    // 位置と向きを設定
    perspCamera.position.copy(position);
    perspCamera.quaternion.copy(quaternion);
    perspCamera.up.copy(up);
    
    // react-three-fiberのsetメソッドを使って新しいカメラを設定
    set({ camera: perspCamera });
    
    // 状態を更新
    setIsOrtho(false);
  }, [isOrtho, camera, set, updatePerspectiveCamera]);

  // ウィンドウサイズ変更時にカメラの設定を更新
  useEffect(() => {
    if (isOrtho && camera instanceof THREE.OrthographicCamera) {
      updateOrthographicCamera(camera);
    } else if (!isOrtho && camera instanceof THREE.PerspectiveCamera) {
      updatePerspectiveCamera(camera);
    }
  }, [size, isOrtho, camera, updateOrthographicCamera, updatePerspectiveCamera]);

  const setCameraView = useCallback((presetKey: CameraViewPreset) => {
    // ビューモードに応じた位置を計算
    const preset = cameraPresets[presetKey];
    const mazeCenterOffset = mazeSize * CELL_SIZE / 2;
    let adjustedPosition;

    // ビューの種類に応じて位置を調整
    if (presetKey === 'top') {
      adjustedPosition = new THREE.Vector3(mazeCenterOffset, mazeCenterOffset, mazeSize * CELL_SIZE * 1.5); // 真上から
      if (isOrtho) enablePerspectiveCamera();
    } else if (presetKey === 'side') {
      adjustedPosition = new THREE.Vector3(mazeCenterOffset, -mazeSize * CELL_SIZE * 1.5, mazeCenterOffset); // 横から
      if (isOrtho) enablePerspectiveCamera();
    } else if (presetKey === 'ortho') {
      // 直交投影モード
      enableOrthographicCamera();
      return; // enableOrthographicCamera内でカメラ位置とターゲットを設定するため、ここで終了
    } else {
      // angleビューなど、その他のプリセット
      adjustedPosition = new THREE.Vector3(...preset.position)
        .add(new THREE.Vector3(mazeCenterOffset, mazeCenterOffset, 0))
        .normalize()
        .multiplyScalar(distanceFactor);
      if (isOrtho) enablePerspectiveCamera();
    }
    
    // カメラのターゲットを迷路の中心に設定
    const target = new THREE.Vector3(mazeSize * CELL_SIZE / 2, mazeSize * CELL_SIZE / 2, 0);
    mazeCenterRef.current = target.clone();

    // カメラの位置を設定
    camera.position.copy(adjustedPosition);
    camera.lookAt(target);
    
    // コントロールの更新
    const currentControls = controlsRef.current || controlsFromHook;
    if (currentControls) {
      if ('target' in currentControls && typeof (currentControls as any).target?.copy === 'function') {
        (currentControls as any).target.copy(target);
      }
      if (typeof (currentControls as any).update === 'function') {
        (currentControls as any).update();
      }
    }
  }, [
    camera, 
    controlsFromHook, 
    mazeSize, 
    distanceFactor, 
    enableOrthographicCamera, 
    enablePerspectiveCamera,
    isOrtho
  ]);

  // カメラのパースペクティブを切り替える関数
  const toggleCameraProjection = useCallback(() => {
    if (isOrtho) {
      setCameraView('angle'); // 透視投影に戻す場合はangleビューに
    } else {
      setCameraView('ortho'); // 直交投影に切り替え
    }
  }, [isOrtho, setCameraView]);

  // 初期設定
  useEffect(() => {
    setCameraView(initialViewPreset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialViewPreset]);

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
      } else if (key === '4') {
        setCameraView('ortho');
      } else if (key === 'o') {
        // Oキーで直交投影モードと透視投影モードを切り替え
        toggleCameraProjection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    // クリーンアップ関数内で handleKeyDown を参照
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetCamera, setCameraView, toggleCameraProjection]);

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
      enableRotate={!isOrtho} // 直交投影カメラの場合、回転を無効化
    />
  );
};

export default CameraController;
