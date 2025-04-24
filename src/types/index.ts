export interface MazeData {
    size: number; // 迷路のサイズ(常に幅と高さは同一の正方形とする)
    walls: {
      vwall: boolean[][];  // 垂直向きの壁の存在
      hwall: boolean[][];   // 水平向きの壁の存在
    };
    start: { x: number; y: number }; // マス目単位でのスタート座標
    goal: { x: number; y: number }[]; // マス目単位でのゴール座標
}

export interface MouseState {
    position: { x: number; y: number }; // 物理座標[m] (Three.jsのX-Y平面に対応)
    angle: number; // 物理角度[rad] Z軸周りの回転 (Three.js空間に対応)
    // アニメーションのための追加情報 (必要に応じて追加)
    // isMoving?: boolean;
    // moveProgress?: number;
}

export interface TrajectoryElement {
    position: { x: number; y: number }; // 物理座標[m]単位
    angle : number; // 物理角度[rad] X軸方向が0度、Y軸方向が90度
}

export type TrajectoryProfile = Map<number, TrajectoryElement> // 時刻をキー、値をその時刻での位置・角度としたプロファイル

// カメラプリセットのキーの型
export type CameraViewPreset = 'top' | 'angle' | 'side';
