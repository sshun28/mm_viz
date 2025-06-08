import { useRef, MutableRefObject } from 'react';
import { CameraControlAPI } from '../components/MicromouseVisualizer/CameraController';
import { CameraViewPreset } from '../types';

/**
 * カメラ操作用のカスタムフック
 * CameraControllerとの橋渡しを行い、外部からカメラを操作できるAPIを提供
 */
export const useCamera = (): {
  cameraRef: MutableRefObject<CameraControlAPI | null>;
  setCameraView: (preset: CameraViewPreset) => void;
  resetCamera: (preset?: CameraViewPreset) => void;
  toggleCameraProjection: () => void;
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

  return {
    cameraRef,
    setCameraView,
    resetCamera,
    toggleCameraProjection,
  };
};