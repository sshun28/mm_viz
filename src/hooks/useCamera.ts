import { useRef, MutableRefObject } from 'react';
import { CameraControlAPI } from '../components/MicromouseVisualizer/CameraController';
import { CameraViewPreset } from '../types';

/**
 * カメラ操作用のカスタムフック
 * CameraControllerとの橋渡しを行い、外部からカメラを操作できるAPIを提供
 * 
 * @example
 * ```typescript
 * const { setCameraView, zoomToRegion } = useCamera();
 * 
 * // ビューを切り替え
 * setCameraView('top');
 * 
 * // 物理座標で指定した領域にズーム（メートル単位）
 * zoomToRegion(0, 0, 0.27, 0.27); // スタート領域
 * ```
 */
export const useCamera = (): {
  cameraRef: MutableRefObject<CameraControlAPI | null>;
  setCameraView: (preset: CameraViewPreset) => void;
  resetCamera: (preset?: CameraViewPreset) => void;
  toggleCameraProjection: () => void;
  zoomToRegion: (x1: number, y1: number, x2: number, y2: number) => void;
} => {
  const cameraRef = useRef<CameraControlAPI | null>(null);

  const setCameraView = (preset: CameraViewPreset) => {
    if (cameraRef.current) {
      cameraRef.current.setCameraView(preset);
    }
  };

  const resetCamera = (preset?: CameraViewPreset) => {
    if (cameraRef.current) {
      cameraRef.current.resetCamera(preset);
    }
  };

  const toggleCameraProjection = () => {
    if (cameraRef.current) {
      cameraRef.current.toggleCameraProjection();
    }
  };

  const zoomToRegion = (x1: number, y1: number, x2: number, y2: number) => {
    if (cameraRef.current) {
      cameraRef.current.zoomToRegion(x1, y1, x2, y2);
    }
  };

  return {
    cameraRef,
    setCameraView,
    resetCamera,
    toggleCameraProjection,
    zoomToRegion,
  };
};