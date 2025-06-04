# mm_viz

マイクロマウス迷路探索の3D可視化を行うReactコンポーネントライブラリです。Three.js/React Three Fiberを使用してマイクロマウスロボットの迷路ナビゲーションをインタラクティブに3D表示します。

## 特徴

- 🎯 **リアルタイム3D可視化**: マイクロマウスの迷路探索をリアルタイムで3D表示
- 🎮 **軌跡アニメーション**: 時間ベースの軌跡再生・一時停止・シーク機能
- 📱 **インタラクティブカメラ**: 複数のカメラプリセット（トップ・アングル・サイド・正射影）
- ⚡ **高性能レンダリング**: InstancedMeshによる最適化された壁・柱の描画
- 🔧 **コンポーネント合成**: 柔軟な子コンポーネント組み合わせによるカスタマイズ

## クイックスタート

### 依存関係のインストール

```bash
npm install
```

### 開発サーバーの起動

```bash
npm run storybook
```

ブラウザで `http://localhost:6006` を開くと、Storybookの開発環境でコンポーネントを確認できます。

### ビルド

```bash
npm run build-storybook
```

## アーキテクチャ

### コア構造

プロジェクトは**コンポーネント合成パターン**を採用しており、`MicromouseVisualizer`がメインコンテナとして動作し、子コンポーネントをpropsとして受け取る設計です：

```
MicromouseVisualizer (メインコンテナ)
├── Maze (迷路の3D描画)
├── CameraController (カメラ制御・プリセット)
└── 子コンポーネント (props経由):
    ├── Mouse (3Dマウスモデル)
    ├── CellMarker (セルハイライト)
    ├── TextLabel (テキストオーバーレイ)
    ├── TrajectoryPath (軌道可視化)
    └── PlaybackControls (アニメーション制御)
```

### 使用例

```tsx
import MicromouseVisualizer from './src/components/MicromouseVisualizer/MicromouseVisualizer';
import TrajectoryPath from './src/components/MicromouseVisualizer/TrajectoryPath';
import PlaybackControls from './src/components/MicromouseVisualizer/PlaybackControls';
import { TrajectoryProvider } from './src/providers/TrajectoryProvider';

<TrajectoryProvider trajectoryProfile={trajectoryData} initialSpeed={1}>
  <MicromouseVisualizer mazeData={mazeData} width={800} height={600}>
    <TrajectoryPath pastColor="#00aaff" />
    <Mouse mouseState={{ position: { x: 0, y: 0 }, angle: Math.PI / 2 }} />
  </MicromouseVisualizer>
  <PlaybackControls showTimeDisplay={true} showSpeedControls={true} />
</TrajectoryProvider>
```

## 主要コンポーネント

### MicromouseVisualizer

メインの3D可視化コンテナ

**Props:**
- `mazeData: MazeData` - 迷路の構造データ
- `width: number` - キャンバス幅
- `height: number` - キャンバス高さ
- `showGridHelper?: boolean` - グリッドヘルパー表示
- `showAxesHelper?: boolean` - 軸ヘルパー表示
- `initialViewPreset?: 'top' | 'angle' | 'side' | 'ortho'` - 初期カメラプリセット

### TrajectoryPath

マウスの軌跡を実線で表示

**Props:**
- `pastColor?: string` - 軌跡の色（デフォルト: '#00aaff'）
- `lineWidth?: number` - 線の太さ（デフォルト: 2）
- `opacity?: number` - 透明度（デフォルト: 0.7）

### PlaybackControls

軌跡アニメーションの制御UI

**Props:**
- `showTimeDisplay?: boolean` - 時間表示
- `showSpeedControls?: boolean` - 速度制御
- `showSeekBar?: boolean` - シークバー表示

## データ構造

### MazeData
```tsx
interface MazeData {
  size: number;
  walls: {
    vwall: boolean[][];  // 垂直壁
    hwall: boolean[][];  // 水平壁
  };
  start: { x: number; y: number };
  goal: { x: number; y: number }[];
}
```

### TrajectoryProfile
```tsx
type TrajectoryProfile = Map<number, TrajectoryElement>;

interface TrajectoryElement {
  position: { x: number; y: number };
  angle: number;
}
```

## 技術仕様

- **フレームワーク**: React 19 + TypeScript
- **3Dエンジン**: Three.js + React Three Fiber
- **開発環境**: Storybook 8
- **テスト**: Vitest + Playwright
- **座標系**: Z-up右手座標系、物理単位はメートル（セルサイズ: 0.09m）

## パフォーマンス最適化

- **InstancedMesh**: 壁・柱の効率的な一括レンダリング
- **バイナリサーチ**: 大きな軌道データセットでの高速時間検索
- **Stats.js統合**: リアルタイムFPS・メモリ監視
- **ポイント間引き**: 軌跡の単純化によるレンダリング軽量化

## 開発

プロジェクトはStorybookをメイン開発環境として使用しています。以下のストーリーが利用可能です：

- **基本可視化**: 迷路とマウスの表示
- **軌跡アニメーション**: 時間ベースの軌跡再生
- **カメラプリセット**: 異なる視点からの表示
- **カスタマイズ例**: 色・線幅・透明度の調整

## ライセンス

ISC