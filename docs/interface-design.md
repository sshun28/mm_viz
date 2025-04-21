# 5. インターフェース設計

コンポーネントのプロップス、APIメソッド、イベントハンドラの設計です。
型定義の詳細は [`src/types/index.ts`](../src/types/index.ts) を参照してください。

### 5.1 プロップスと型定義 (`MicromouseVisualizerProps`)
コンポーネントが受け取るプロパティとその型です。

```typescript
import type { MazeData, MouseState, CameraViewPreset } from '../src/types';

interface MicromouseVisualizerProps {
  // 迷路データ
  mazeData?: MazeData;
  // 軌跡データ（時系列プロファイル） - 未実装
  // trajectoryProfile?: TrajectoryProfile;
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
  // cameraType?: 'perspective' | 'orthographic'; // 未実装
  initialViewPreset?: CameraViewPreset;
  // 壁表示オプション - 未実装
  // wallColorDiscovered?: string;
  // wallColorUndiscovered?: string;
  // wallOpacityUndiscovered?: number;
  // イベントコールバック - 未実装
  // onMazeLoaded?: () => void;
  // onStepComplete?: (mouseState: MouseState) => void;
  // onGoalReached?: () => void;
  // onCellClick?: (x: number, y: number) => void;
  // 再生コントロールオプション - 未実装
  // autoPlay?: boolean;
  // speed?: number; // 再生速度の倍率
  // stepInterval?: number; // ステップ間の時間間隔（ミリ秒）
}
```

### 5.2 APIメソッド (`MicromouseVisualizerMethods`)
外部からコンポーネントを操作するためのメソッドです。（現時点では未実装）

```typescript
import type { MazeData, MouseState, CameraViewPreset } from '../src/types';

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
  setCameraView: (preset: CameraViewPreset) => void;
  // setCameraType: (type: 'perspective' | 'orthographic') => void;
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
