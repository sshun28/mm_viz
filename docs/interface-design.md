# 5. インターフェース設計

### 5.1 プロップスと型定義
```typescript
interface MicromouseVisualizerProps {
  // 迷路データ
  mazeData?: MazeData;
  // 軌跡データ（時系列プロファイル）
  trajectoryProfile?: TrajectoryProfile;
  // マウスの初期状態
  initialMouseState?: MouseState;
  // 表示サイズ
  width?: number;
  height?: number;
  // 表示オプション
  backgroundColor?: string;
  showGridHelper?: boolean;
  showAxesHelper?: boolean;
  // カメラオプション
  cameraType?: 'perspective' | 'orthographic';
  initialViewPreset?: 'top' | 'angle' | 'side';
  // 壁表示オプション
  wallColorDiscovered?: string;
  wallColorUndiscovered?: string;
  wallOpacityUndiscovered?: number;
  // イベントコールバック
  onMazeLoaded?: () => void;
  onStepComplete?: (mouseState: MouseState) => void;
  onGoalReached?: () => void;
  onCellClick?: (x: number, y: number) => void;
  // 再生コントロールオプション
  autoPlay?: boolean;
  speed?: number; // 再生速度の倍率
  stepInterval?: number; // ステップ間の時間間隔（ミリ秒）
}
```

### 5.2 APIメソッド
各コンポーネントが外部から操作できるメソッド：

```typescript
interface MicromouseVisualizerMethods {
  // アニメーション制御
  play: () => void;
  pause: () => void;
  stop: () => void; // 最初に戻る
  step: (forward?: boolean) => void; // 1ステップ進める/戻す
  seekTo: (time: number) => void; // 特定時間にシーク
  
  // マウス制御
  setMouseState: (state: MouseState) => void;
  
  // 迷路操作
  setMazeData: (data: MazeData) => void;
  toggleWall: (x: number, y: number, direction: 'north' | 'east' | 'south' | 'west') => void;
  
  // カメラ操作
  setCameraView: (preset: 'top' | 'angle' | 'side') => void;
  setCameraType: (type: 'perspective' | 'orthographic') => void;
}
```

### 5.3 イベントハンドラ
- **マウスイベント**：
  - セルクリック：`onCellClick`を発火し、迷路座標（x, y）を返す
  - 壁クリック：特定のセルの壁を選択する
  - ドラッグ：カメラ位置の調整
  
- **キーボードショートカット**：
  - スペース：再生/一時停止
  - 矢印キー：次/前のステップ
  - 1-9キー：再生速度の切り替え
  - Rキー：カメラビューをリセット
  - Vキー：カメラタイプ切り替え
  
### 5.3 外部APIとの連携
- 迷路データのインポート/エクスポート機能
  - Mazefile形式に対応
- ログの再生機能
