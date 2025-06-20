import React, { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import { useThree, RootState } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { cameraPresets, CELL_SIZE } from '../../config/constants';
import { CameraViewPreset } from '../../types';

// カメラコントロールAPIの型定義
export interface CameraControlAPI {
  setCameraView: (preset: CameraViewPreset) => void;
  resetCamera: (preset?: CameraViewPreset) => void;
  toggleCameraProjection: () => void;
  /**
   * 指定した物理座標の領域にズームする（直交投影モード）
   * @param x1 領域の左下X座標（メートル）
   * @param y1 領域の左下Y座標（メートル）
   * @param x2 領域の右上X座標（メートル）
   * @param y2 領域の右上Y座標（メートル）
   */
  zoomToRegion: (x1: number, y1: number, x2: number, y2: number) => void;
}

interface CameraControllerProps {
  initialViewPreset?: CameraViewPreset;
  mazeSize?: number;
}

// カメラコントロール用コンポーネント
const CameraController = forwardRef<CameraControlAPI, CameraControllerProps>(({ initialViewPreset = 'angle', mazeSize = 16 }, ref) => {
  const { camera, controls: controlsFromHook, set, size } = useThree<RootState>();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const mazeCenterRef = useRef<THREE.Vector3>(
    new THREE.Vector3(mazeSize * CELL_SIZE / 2, mazeSize * CELL_SIZE / 2, 0)
  );
  const [isOrtho, setIsOrtho] = useState(false);
  
  // zoomToRegionのペンディング状態を管理
  const pendingZoomRef = useRef<{x1: number, y1: number, x2: number, y2: number} | null>(null);

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
    
    // カメラのup方向を設定（Z軸が上）
    orthoCamera.up.set(0, 0, 1);
    
    // 迷路の中心をターゲットとする
    const target = new THREE.Vector3(mazeCenterOffset, mazeCenterOffset, 0);
    orthoCamera.lookAt(target);
    
    // react-three-fiberのsetメソッドを使って新しいカメラを設定
    set({ camera: orthoCamera });
    
    // コントロールの更新とリセット
    const currentControls = controlsRef.current || controlsFromHook;
    if (currentControls) {
      // OrbitControlsをリセットして傾きを解消
      if ('reset' in currentControls && typeof (currentControls as any).reset === 'function') {
        (currentControls as any).reset();
      }
      
      // ターゲットを設定
      if ('target' in currentControls && typeof (currentControls as any).target?.copy === 'function') {
        (currentControls as any).target.copy(target);
        (currentControls as any).target.z = 0; // Z座標を0に固定
      }
      
      // カメラオブジェクトを更新
      if ('object' in currentControls) {
        (currentControls as any).object = orthoCamera;
      }
      
      // 位置と向きを再設定
      orthoCamera.position.set(mazeCenterOffset, mazeCenterOffset, mazeSize * CELL_SIZE * 2);
      orthoCamera.up.set(0, 0, 1);
      orthoCamera.lookAt(target);
      
      // 更新
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

  // isOrthoの状態変化を監視してペンディング中のzoomToRegionを実行
  useEffect(() => {
    if (isOrtho && camera instanceof THREE.OrthographicCamera && pendingZoomRef.current) {
      console.log('isOrtho became true, executing pending zoom...');
      const { x1, y1, x2, y2 } = pendingZoomRef.current;
      const currentControls = controlsRef.current || controlsFromHook;
      
      // ペンディング状態をクリア
      pendingZoomRef.current = null;
      
      // 少し遅延してからズーム実行（カメラの初期化完了を待つ）
      setTimeout(() => {
        performRegionZoom(camera, x1, y1, x2, y2, currentControls);
      }, 50);
    }
  }, [isOrtho, camera, controlsFromHook]);

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

  // カメラリセット機能
  const resetCamera = useCallback((presetKey: CameraViewPreset = initialViewPreset) => {
    setCameraView(presetKey);
  }, [initialViewPreset, setCameraView]);

  // カメラのパースペクティブを切り替える関数
  const toggleCameraProjection = useCallback(() => {
    if (isOrtho) {
      setCameraView('angle'); // 透視投影に戻す場合はangleビューに
    } else {
      setCameraView('ortho'); // 直交投影に切り替え
    }
  }, [isOrtho, setCameraView]);

  // 指定された領域にズームする関数（直交投影モード専用）
  const zoomToRegion = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    console.log('zoomToRegion called:', { x1, y1, x2, y2, isOrtho });
    
    // OrbitControlsを取得
    const currentControls = controlsRef.current || controlsFromHook;
    
    // 直交投影モードでない場合は切り替える
    if (!isOrtho) {
      console.log('Not in ortho mode, switching and setting pending zoom...');
      
      // ズーム領域をペンディング状態に保存
      pendingZoomRef.current = { x1, y1, x2, y2 };
      
      // OrbitControlsをリセットしてから直交投影に切り替える
      if (currentControls && 'reset' in currentControls && typeof (currentControls as any).reset === 'function') {
        (currentControls as any).reset();
      }
      
      // 直交投影に切り替え（useEffectが状態変化を検知してズーム実行）
      enableOrthographicCamera();
      return;
    }
    
    // 既存のカメラが直交投影カメラの場合は直接ズーム処理を実行
    if (camera instanceof THREE.OrthographicCamera) {
      console.log('Already in ortho mode, performing zoom immediately...');
      performRegionZoom(camera, x1, y1, x2, y2, currentControls);
    }
  }, [camera, controlsRef, controlsFromHook, enableOrthographicCamera, isOrtho]);

  // ズーム領域設定の実際の処理（再帰呼び出しを避けるため分離）
  const performRegionZoom = useCallback((
    orthoCamera: THREE.OrthographicCamera,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    currentControls: any
  ) => {
    // 領域の中心とサイズを計算
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    const regionWidth = Math.abs(x2 - x1);
    const regionHeight = Math.abs(y2 - y1);
    
    // Three.jsの直交投影の座標系を確認
    // left/right: X軸 (左右)
    // top/bottom: Y軸 (上下)
    // 注意: Three.jsのtop/bottomは数学的なY軸と同じ向き（topが正の値、bottomが負の値）
    // OrbitControlsを一時的に無効化し、ズームとパンも無効化
    const wasEnabled = currentControls ? (currentControls as any).enabled : true;
    const wasZoomEnabled = currentControls ? (currentControls as any).enableZoom : true;
    const wasPanEnabled = currentControls ? (currentControls as any).enablePan : true;
    
    if (currentControls) {
      (currentControls as any).enabled = false;
      // 直交投影カメラの投影範囲を確実に制御するため、ズームとパンを一時的に無効化
      (currentControls as any).enableZoom = false;
      (currentControls as any).enablePan = false;
    }
    
    // アスペクト比を考慮してカメラの範囲を設定
    const aspect = size.width / size.height;
    const padding = Math.max(regionWidth, regionHeight) * 0.1; // 10%のパディング
    
    // 指定された範囲を確実に含むように計算
    const paddedRegionWidth = regionWidth + padding;
    const paddedRegionHeight = regionHeight + padding;
    
    let adjustedWidth, adjustedHeight;
    
    if (aspect >= 1) {
      // 横長画面の場合：縦方向を基準にして横方向を調整
      adjustedHeight = paddedRegionHeight;
      adjustedWidth = adjustedHeight * aspect;
      
      // 横方向が足りない場合は横方向を基準に再計算
      if (adjustedWidth < paddedRegionWidth) {
        adjustedWidth = paddedRegionWidth;
        adjustedHeight = adjustedWidth / aspect;
      }
    } else {
      // 縦長画面の場合：横方向を基準にして縦方向を調整
      adjustedWidth = paddedRegionWidth;
      adjustedHeight = adjustedWidth / aspect;
      
      // 縦方向が足りない場合は縦方向を基準に再計算
      if (adjustedHeight < paddedRegionHeight) {
        adjustedHeight = paddedRegionHeight;
        adjustedWidth = adjustedHeight * aspect;
      }
    }
    
    // 既存のカメラの投影設定を更新
    // 問題の修正: 直交投影カメラの投影範囲は、カメラ位置を基準とした相対座標で設定する
    // カメラは(centerX, centerY, height)の位置から(centerX, centerY, 0)を見下ろしているので
    // 投影範囲は中心からの相対距離で設定する必要がある
    orthoCamera.left = -adjustedWidth / 2;
    orthoCamera.right = adjustedWidth / 2;
    orthoCamera.top = adjustedHeight / 2;
    orthoCamera.bottom = -adjustedHeight / 2;
    orthoCamera.updateProjectionMatrix();
    
    // カメラの位置を設定（真上から見下ろす）
    const cameraHeight = mazeSize * CELL_SIZE * 2;
    orthoCamera.position.set(centerX, centerY, cameraHeight);
    
    // カメラのup方向を設定（Z軸が上方向、プロジェクトの座標系）
    orthoCamera.up.set(0, 0, 1);
    
    // カメラのターゲットを領域の中心に設定
    const target = new THREE.Vector3(centerX, centerY, 0);
    orthoCamera.lookAt(target);
    
    // OrbitControlsのターゲットと状態を更新
    if (currentControls) {
      // 一時的にOrbitControlsを完全に無効化してテスト

      // ターゲットを設定
      if ('target' in currentControls && typeof (currentControls as any).target?.copy === 'function') {
        (currentControls as any).target.copy(target);
        (currentControls as any).target.z = 0; // Z座標を0に固定
      }
      
      // オブジェクトの再設定を確実に行う
      if ('object' in currentControls) {
        (currentControls as any).object = orthoCamera;
      }
      
      // カメラの位置、向き、ターゲットを enableOrthographicCamera と同じ方法で設定
      orthoCamera.position.set(centerX, centerY, cameraHeight);
      orthoCamera.up.set(0, 0, 1); // Z軸が上方向（プロジェクトの座標系）
      orthoCamera.lookAt(target);
      
      // 投影範囲を再度強制設定（OrbitControlsの影響を確実に排除）
      orthoCamera.left = -adjustedWidth / 2;
      orthoCamera.right = adjustedWidth / 2;
      orthoCamera.top = adjustedHeight / 2;
      orthoCamera.bottom = -adjustedHeight / 2;
      orthoCamera.updateProjectionMatrix();
      
      // カメラのズーム状態を確実にリセット
      orthoCamera.zoom = 1.0;
      
      // 投影行列を再更新（ズームリセット後）
      orthoCamera.updateProjectionMatrix();
      
      // OrbitControlsの更新（カメラ設定とズームリセット後）
      if (typeof (currentControls as any).update === 'function') {
        (currentControls as any).update();
      }
      
      // OrbitControlsの内部ズーム状態を再度確認・リセット
      if ('scale' in currentControls) {
        (currentControls as any).scale = 1.0;
      }
      
      // OrbitControlsを再有効化（ズーム・パン操作を可能にする）
      (currentControls as any).enabled = wasEnabled;
      (currentControls as any).enableZoom = wasZoomEnabled;
      (currentControls as any).enablePan = wasPanEnabled;
      
    }
  }, [mazeSize, size.width, size.height]);

  // 外部からカメラを操作できるAPIを公開
  useImperativeHandle(ref, () => ({
    setCameraView,
    resetCamera,
    toggleCameraProjection,
    zoomToRegion,
  }), [setCameraView, resetCamera, toggleCameraProjection, zoomToRegion]);

  // 初期設定
  useEffect(() => {
    setCameraView(initialViewPreset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialViewPreset]);

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
});

CameraController.displayName = 'CameraController';

export default CameraController;
