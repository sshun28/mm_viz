# mm_viz

マイクロマウス迷路探索の3D可視化を行うReactコンポーネントライブラリです。Three.js/React Three Fiberを使用してマイクロマウスロボットの迷路ナビゲーションをインタラクティブに3D表示します。

## インストール

```bash
npm install git+https://github.com/sshun28/mm_viz.git
```

## 3Dモデルについて

このライブラリは3Dモデルを使用します。**設定は不要です** - すべての3DモデルはBase64形式でライブラリに埋め込まれているため、追加の設定なしで使用できます。

### 高度な設定（オプション）

従来のFBXファイルを使用したい場合：

```typescript
import { setUseEmbeddedModels, setModelBasePath } from 'mm_viz';

// 埋め込みモデルを無効化してファイルパスを使用
setUseEmbeddedModels(false);
setModelBasePath('/your-custom-path/3d_models');
```

## 使用方法

### 基本的な使用例

```tsx
import { MicromouseVisualizer } from 'mm_viz';

function App() {
  return (
    <MicromouseVisualizer 
      mazeData={mazeData}
      className="w-full h-screen"
    />
  );
}
```

### レスポンシブデザイン

コンポーネントはデフォルトで親要素の100%のサイズになります。TailwindCSSなどのユーティリティクラスを使用できます：

```tsx
<MicromouseVisualizer 
  mazeData={mazeData}
  className="w-full h-screen rounded-lg shadow-lg"
/>
```

### カスタムスタイル

インラインスタイルも使用可能です：

```tsx
<MicromouseVisualizer 
  mazeData={mazeData}
  style={{
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
  }}
/>
```

## 特徴

- 🎯 **リアルタイム3D可視化**: マイクロマウスの迷路探索をリアルタイムで3D表示
- 📱 **レスポンシブ対応**: 親要素に合わせて自動的にサイズ調整
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
import { TrajectoryProvider } from './src/providers/TrajectoryProvider';
import { usePlaybackControls } from './src/hooks/usePlaybackControls';

<TrajectoryProvider trajectoryProfile={trajectoryData} initialSpeed={1}>
  <MicromouseVisualizer mazeData={mazeData} width={800} height={600}>
    <TrajectoryPath pastColor="#00aaff" />
    <Mouse mouseState={{ position: { x: 0, y: 0 }, angle: Math.PI / 2 }} />
  </MicromouseVisualizer>
  {/* カスタムUIコントロール */}
  <CustomPlaybackControls />
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

### usePlaybackControls

軌跡アニメーション制御のためのheadless hook

**戻り値:**
- `isPlaying: boolean` - 再生状態
- `currentTime: number` - 現在時刻
- `duration: number` - 総再生時間
- `playbackSpeed: number` - 再生速度
- `togglePlayPause: () => void` - 再生/一時停止切り替え
- `handleStop: () => void` - 再生停止
- `handleSeek: (value: number) => void` - シーク操作
- `handleSpeedChange: (speed: number) => void` - 速度変更
- `formatTime: (time: number) => string` - 時間フォーマット
- `formatSpeed: (speed: number) => string` - 速度フォーマット

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

## アーキテクチャの特徴

### Headless UI設計
アニメーション制御などのロジックはheadless hookとして提供され、UI実装は完全に分離されています：

```tsx
// カスタムUIコンポーネントの例
const CustomPlaybackControls = () => {
  const { isPlaying, togglePlayPause, currentTime, formatTime } = usePlaybackControls();
  
  return (
    <div className="your-custom-style">
      <button onClick={togglePlayPause}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <span>{formatTime(currentTime)}</span>
    </div>
  );
};
```

## 開発

プロジェクトはStorybookをメイン開発環境として使用しています。以下のストーリーが利用可能です：

- **基本可視化**: 迷路とマウスの表示
- **軌跡アニメーション**: 時間ベースの軌跡再生（サンプルUIコントロール付き）
- **カメラプリセット**: 異なる視点からの表示
- **カスタマイズ例**: 色・線幅・透明度の調整

## ライセンス

ISC