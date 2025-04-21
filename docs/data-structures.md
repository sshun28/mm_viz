# 3. データ構造

### 3.1 迷路データ形式
```typescript
interface MazeData {
  size: number; // 迷路のサイズ(常に幅と高さは同一の正方形とする)
  walls: {
    vwall: boolean[][];  // 垂直向きの壁の存在
    hwall: boolean[][];   // 水平向きの壁の存在
  };
  start: { x: number; y: number }; // マス目単位でのスタート座標
  goal: { x: number; y: number }[]; // マス目単位でのゴール座標
}
```

### 3.2 マウス状態データ形式
```typescript
interface MouseState {
  position: { x: number; y: number }; // 物理座標[m]単位
  angle : number; // 物理角度[rad] X軸方向が0度、Y軸方向が90度
  // アニメーションのための追加情報
  isMoving: boolean;
  moveProgress: number; // 移動の進行状況を表す
}
```

### 3.3 マウスアニメーション用プロファイル
```typescript
interface TrajectoryElement {
  position: { x: number; y: number }; // 物理座標[m]単位
  angle : number; // 物理角度[rad] X軸方向が0度、Y軸方向が90度
}

type TrajectoryProfile = Map<number, TrajectoryElement> // 時刻をキー、値をその時刻での位置・角度としたプロファイル

```
