# 5. インターフェース設計

コンポーネントのプロップス、APIメソッド、イベントハンドラの設計です。
型定義の詳細は [`src/types/index.ts`](../src/types/index.ts) および [`src/stores/dataStore.ts`](../src/stores/dataStore.ts) を参照してください。

## 5.1 DataProvider インターフェース

### 5.1.1 DataProviderProps
統一データ管理プロバイダのプロパティです。

```typescript
import type { MazeData, MouseState } from '../src/types';

interface DataProviderProps {
  children: React.ReactNode;
  initialMazeData?: MazeData | null;
  initialMouseState?: MouseState;
}
```

### 5.1.2 useData フック
Zustandストアへの直接アクセスを提供するフックです。

```typescript
// データ読み取り
const mazeData = useData((state) => state.mazeData);
const mouseState = useData((state) => state.mouseState);
const cellMarkers = useData((state) => state.cellMarkers);
const textLabels = useData((state) => state.textLabels);

// データ更新
const setMazeData = useData((state) => state.setMazeData);
const updateMouseState = useData((state) => state.updateMouseState);
const addCellMarker = useData((state) => state.addCellMarker);
const addTextLabel = useData((state) => state.addTextLabel);
```

## 5.2 MicromouseVisualizer インターフェース

### 5.2.1 プロップスと型定義 (`MicromouseVisualizerProps`)
メインビジュアライザーコンポーネントが受け取るプロパティです。迷路データやマウス状態は DataProvider 経由で取得します。

```typescript
import type { CameraViewPreset } from '../src/types';

interface MicromouseVisualizerProps {
  // 表示サイズ
  width?: number | string;
  height?: number | string;
  // 表示オプション
  backgroundColor?: string;
  showGridHelper?: boolean;
  showAxesHelper?: boolean;
  showPerformanceStats?: boolean;
  showDiagonalGrid?: boolean;
  // カメラオプション
  initialViewPreset?: CameraViewPreset;
  // 子コンポーネント
  children?: React.ReactNode;
  // カメラ制御用ref
  cameraRef?: React.MutableRefObject<CameraControlAPI | null>;
  // CSS
  className?: string;
  style?: React.CSSProperties;
}
```

### 5.2.2 APIメソッド (`MicromouseVisualizerAPI`)
外部からビジュアライザーのカメラを操作するためのメソッドです。

```typescript
import type { CameraViewPreset } from '../src/types';

interface MicromouseVisualizerAPI {
  setCameraView: (preset: CameraViewPreset) => void;
  resetCamera: (preset?: CameraViewPreset) => void;
  toggleCameraProjection: () => void;
  zoomToRegion: (x1: number, y1: number, x2: number, y2: number) => void;
}
```

## 5.3 子コンポーネント インターフェース

### 5.3.1 Mouse コンポーネント
```typescript
interface MouseProps {
  mouseState?: MouseState;          // オプション（DataProviderから自動取得）
  fbxPath?: string;                 // FBXファイルパス
  scale?: [number, number, number]; // モデルスケール
  modelColor?: string;              // モデル色
  showArrowHelper?: boolean;        // 向き矢印表示
  modelOffset?: {                   // モデルオフセット調整
    position?: [number, number, number];
    rotation?: [number, number, number];
  };
}
```

### 5.3.2 CellMarker コンポーネント
```typescript
interface CellMarkerProps {
  cell: CellPosition;               // セル座標 {x, y}
  color?: string;                   // 表示色
  opacity?: number;                 // 透明度
  scale?: number;                   // スケール
  type?: 'square' | 'circle' | 'diamond'; // 形状
  height?: number;                  // Z座標オフセット
  visible?: boolean;                // 表示/非表示
}
```

### 5.3.3 TextLabel コンポーネント
```typescript
interface TextLabelProps {
  cell?: CellPosition;              // セル座標（物理座標と排他）
  position?: [number, number, number]; // 物理座標（セル座標と排他）
  text: string;                     // 表示テキスト
  color?: string;                   // テキスト色
  backgroundColor?: string;         // 背景色
  fontSize?: number;                // フォントサイズ
  height?: number;                  // Z座標オフセット
  rotation?: [number, number, number]; // 回転角度
  visible?: boolean;                // 表示/非表示
}
```

## 5.4 データ管理 APIメソッド

### 5.4.1 迷路・マウス データ操作
```typescript
// 迷路データ
const setMazeData = useData((state) => state.setMazeData);
const updateMazeData = useData((state) => state.updateMazeData);

// マウス状態
const setMouseState = useData((state) => state.setMouseState);
const updateMouseState = useData((state) => state.updateMouseState);
```

### 5.4.2 マーカー・ラベル 管理
```typescript
// セルマーカー
const addCellMarker = useData((state) => state.addCellMarker);
const updateCellMarker = useData((state) => state.updateCellMarker);
const removeCellMarker = useData((state) => state.removeCellMarker);
const clearCellMarkers = useData((state) => state.clearCellMarkers);

// テキストラベル
const addTextLabel = useData((state) => state.addTextLabel);
const updateTextLabel = useData((state) => state.updateTextLabel);
const removeTextLabel = useData((state) => state.removeTextLabel);
const clearTextLabels = useData((state) => state.clearTextLabels);

// 全データクリア
const clearAll = useData((state) => state.clearAll);
```

## 5.5 TrajectoryProvider インターフェース (軌道アニメーション)

### 5.5.1 useTrajectory フック
```typescript
interface TrajectoryHookReturn {
  currentMouseState: MouseState;
  currentTime: number;
  isPlaying: boolean;
  duration: number;
  playbackSpeed: number;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seekTo: (time: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setLoopEnabled: (enabled: boolean) => void;
}
```

## 5.6 イベントハンドラ

### 5.6.1 カメラ操作
- **マウスイベント**：
  - ドラッグ：カメラ位置の調整（OrbitControls）
  - ホイール：ズーム操作
  
- **キーボードショートカット** (予定)：
  - Rキー：カメラビューをリセット
  - 1-4キー：プリセットビュー切り替え

### 5.6.2 インタラクション (将来実装予定)
- **セルクリック**：迷路セルの選択・操作
- **マーカー操作**：セルマーカーやラベルの動的編集
- **軌道操作**：軌道アニメーションの再生制御

## 5.7 外部APIとの連携

### 5.7.1 迷路データの管理
```typescript
// 迷路ファイルからの読み込み
import { loadMazeFromUrl } from '../src/utils/mazeLoader';

const loadMaze = async () => {
  const mazeData = await loadMazeFromUrl(url);
  const setMazeData = useData((state) => state.setMazeData);
  setMazeData(mazeData);
};
```

### 5.7.2 リアルタイムデータ更新
```typescript
// WebSocketやPolling経由でのデータ更新例
const updateLiveData = (newMouseState: MouseState) => {
  const updateMouseState = useData((state) => state.updateMouseState);
  updateMouseState(newMouseState);
};

// セルマーカーの動的追加
const addExploredCell = (cell: CellPosition) => {
  const addCellMarker = useData((state) => state.addCellMarker);
  addCellMarker({
    id: `explored-${cell.x}-${cell.y}`,
    cell,
    color: '#00ff00',
    visible: true
  });
};
```

### 5.7.3 ログ・軌道の再生
```typescript
// TrajectoryProviderと組み合わせた軌道再生
<DataProvider initialMazeData={mazeData}>
  <TrajectoryProvider trajectoryProfile={trajectoryData}>
    <MicromouseVisualizer>
      <Mouse /> {/* useTrajectoryから自動取得 */}
      <TrajectoryPath />
    </MicromouseVisualizer>
  </TrajectoryProvider>
</DataProvider>
```
