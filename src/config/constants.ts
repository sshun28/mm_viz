import * as THREE from 'three';

// --- 定数 ---
export const CELL_SIZE = 0.18; // 1マスの物理サイズ[m] (Three.js空間での単位)
export const WALL_HEIGHT = 0.05; // 壁の高さ[m]
export const WALL_THICKNESS = 0.012; // 壁の厚み[m]
export const FLOOR_THICKNESS = 0.01; // 床の厚み[m]
export const MOUSE_SIZE = CELL_SIZE * 0.5; // マウスの仮サイズ
export const PILLAR_SIZE = WALL_THICKNESS * 1.2; // 柱のサイズ (壁より少し太く)
export const PILLAR_HEIGHT = WALL_HEIGHT; // 柱の高さ (壁と同じ)
export const PILLAR_COLOR = '#aaaaaa'; // 柱の色

// --- カメラプリセット ---
// 座標系: Zが上、Xが右、Yが奥 (右手系)
export const cameraPresets = {
  top: { position: [0, 0, 10], target: [0, 0, 0] }, // 真上から (Z軸プラス方向から)
  angle: { position: [5, -5, 5], target: [0, 0, 0] }, // 斜め上から (Y軸マイナス方向から見る)
  side: { position: [5, 0, 1], target: [0, 0, 0] }, // 横から (X軸プラス方向から)
};
