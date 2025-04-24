import * as THREE from 'three';

// --- 定数 ---
export const CELL_SIZE = 0.09; // 1マスの物理サイズ[m] (Three.js空間での単位)
export const FLOOR_THICKNESS = 0.01; // 床の厚み[m]
export const MOUSE_SIZE = CELL_SIZE * 0.5; // マウスの仮サイズ
export const PILLAR_COLOR = '#aaaaaa'; // 柱の色

// --- カメラプリセット ---
// 座標系: Zが上、Xが右、Yが奥 (右手系)
export const cameraPresets = {
  top: { position: [0, 0, 10], target: [0, 0, 0] }, // 真上から (Z軸プラス方向から)
  angle: { position: [5, -5, 5], target: [0, 0, 0] }, // 斜め上から (Y軸マイナス方向から見る)
  side: { position: [5, 0, 1], target: [0, 0, 0] }, // 横から (X軸プラス方向から)
};
