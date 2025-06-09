# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**mm_viz**は、マイクロマウス迷路探索の3D可視化を行うReactコンポーネントライブラリです。Three.js/React Three Fiberを使用してマイクロマウスロボットの迷路ナビゲーションをインタラクティブに3D表示します。

## 開発コマンド

```bash
# Storybookの開発サーバーを起動（メイン開発環境）
npm run storybook

# Storybookをビルド
npm run build-storybook

# テストを実行（現在は未実装）
npm test
```

## アーキテクチャ

### コア構造
プロジェクトは**コンポーネント合成パターン**と**統一データ管理**を採用しており、`DataProvider`が状態管理の中心として機能し、`MicromouseVisualizer`がメインコンテナとして動作する設計です：

```
DataProvider (ハイブリッド状態管理)
├── Zustand Store (制御状態)
│   ├── 迷路データ・マウス状態
│   ├── セルマーカー・テキストラベル
│   └── 軌道プロファイル・再生設定
├── TrajectoryAnimationContext (refベース高速状態)
│   ├── currentTimeRef (現在時間)
│   └── currentMouseStateRef (現在マウス状態)
└── MicromouseVisualizer (メインコンテナ)
    ├── Maze (迷路の3D描画)
    ├── CameraController (カメラ制御・プリセット)
    ├── TrajectoryAnimationController (useFrame制御)
    └── 子コンポーネント (useData + useSharedTrajectoryAnimation):
        ├── Mouse (3Dマウスモデル - ref状態優先)
        ├── CellMarker (セルハイライト)
        ├── TextLabel (テキストオーバーレイ)
        ├── TrajectoryPath (軌道可視化 - ref状態使用)
        └── PlaybackControls (再生制御UI)
```

### 状態管理とアニメーション
- **DataProvider**: 統一データ管理プロバイダ（ハイブリッド状態管理システム）
  - `MazeData`: 迷路データの管理
  - `MouseState`: マウス位置・角度の管理
  - `CellMarkerData`: セルマーカーの管理
  - `TextLabelData`: テキストラベルの管理
  - `TrajectoryProfile`: 軌道再生データの管理
- **useData**: データアクセス・更新用フック（Zustandストアへの直接アクセス）
- **ハイブリッド状態管理**: パフォーマンス最適化のための二重管理システム
  - **Zustand**: UI制御状態（再生/一時停止/設定）の管理
  - **React Refs**: 高頻度更新状態（アニメーション時間・マウス位置）の管理
- **useSharedTrajectoryAnimation**: refベースのアニメーション状態共有フック
- **usePlaybackControls**: 軌道再生制御フック（再生/一時停止/シーク/速度調整）
- 時間ベースの補間により滑らかなマウス移動を実現
- 大きな軌道データセット用のバイナリサーチ最適化

### ハイブリッド状態管理システム詳細
軌道アニメーションのパフォーマンス問題を解決するため、状態管理を2層に分離：

**制御状態（Zustand管理）**:
- 再生/一時停止/停止状態
- 再生速度設定
- ループ設定
- 軌道プロファイルデータ

**アニメーション状態（React Refs管理）**:
- 現在の再生時間（60FPS更新）
- 現在のマウス位置・角度（補間計算済み）
- フレーム間の状態変更を効率的に処理

この分離により、UIの反応性を保ちつつ、滑らかな60FPSアニメーションを実現。

### 3Dレンダリングシステム
- **InstancedMesh**を使用した壁・柱の最適化レンダリング
- `/3d_models/`ディレクトリのFBXモデル読み込み（micromouse.fbx, pillar.fbx, wall.fbx）
- Z-up右手座標系、物理単位はメートル（セルサイズ: 0.09m）

### データ構造
- **MazeData**: 壁レイアウト、スタート/ゴール位置
- **MouseState**: 物理座標での位置と角度
- **CellMarkerData**: セルマーカーの表示データ（ID、位置、色、表示状態）
- **TextLabelData**: テキストラベルの表示データ（ID、テキスト、3D位置、表示状態）
- **TrajectoryProfile**: アニメーション用の時間インデックス付きマウス状態

### データ管理パターン
```tsx
// データの読み取り
const mazeData = useData((state) => state.mazeData);
const mouseState = useData((state) => state.mouseState);
const trajectoryProfile = useData((state) => state.trajectoryProfile);
const isPlaying = useData((state) => state.isPlaying);

// データの更新
const setMazeData = useData((state) => state.setMazeData);
const updateMouseState = useData((state) => state.updateMouseState);
const setTrajectoryProfile = useData((state) => state.setTrajectoryProfile);

// セルマーカーの管理
const addCellMarker = useData((state) => state.addCellMarker);
const updateCellMarker = useData((state) => state.updateCellMarker);
const removeCellMarker = useData((state) => state.removeCellMarker);

// 軌道再生制御
const play = useData((state) => state.play);
const pause = useData((state) => state.pause);
const stop = useData((state) => state.stop);
const setPlaybackSpeed = useData((state) => state.setPlaybackSpeed);

// 高性能アニメーション状態（ref管理）
const { currentTimeRef, currentMouseStateRef, updateMouseStateForTime } = useSharedTrajectoryAnimation();

// 再生制御UI用フック
const { isPlaying, currentTime, togglePlayPause, handleSeek } = usePlaybackControls();
```

### API使用ガイド

#### 基本的な使用パターン

**1. 基本的な3D表示**:
```tsx
import { DataProvider, MicromouseVisualizer } from 'mm_viz';

function App() {
  return (
    <DataProvider>
      <MicromouseVisualizer />
    </DataProvider>
  );
}
```

**2. 軌道アニメーション付き表示**:
```tsx
import { DataProvider, MicromouseVisualizer, useData } from 'mm_viz';

function TrajectoryVisualization() {
  const setTrajectoryProfile = useData(state => state.setTrajectoryProfile);
  
  useEffect(() => {
    // TrajectoryProfileデータを設定
    setTrajectoryProfile(trajectoryData);
  }, []);

  return <MicromouseVisualizer />;
}

function App() {
  return (
    <DataProvider>
      <TrajectoryVisualization />
    </DataProvider>
  );
}
```

**3. カスタム再生制御UI**:
```tsx
import { usePlaybackControls } from 'mm_viz';

function CustomPlaybackControls() {
  const { 
    isPlaying, 
    currentTime, 
    duration, 
    togglePlayPause, 
    handleStop, 
    handleSeek 
  } = usePlaybackControls();

  return (
    <div>
      <button onClick={togglePlayPause}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <button onClick={handleStop}>Stop</button>
      <input 
        type="range" 
        min={0} 
        max={duration} 
        value={currentTime}
        onChange={(e) => handleSeek(Number(e.target.value))}
      />
    </div>
  );
}
```

#### 重要な注意点

- **DataProvider必須**: 全てのコンポーネントは`DataProvider`でラップする必要があります
- **useSharedTrajectoryAnimation**: 高性能アニメーション状態が必要な場合のみ使用
- **usePlaybackControls**: UI制御が必要な場合に使用、内部でuseDataを使用
- **パフォーマンス**: 軌道データは事前にソート済みの`Map<number, MouseState>`形式で提供

## 設定とパフォーマンス
- **constants.ts**: セルサイズ、物理寸法、色の定義
- **Stats.js統合**: FPS追跡によるパフォーマンス監視
- **TypeScript**: 厳密な型チェックが有効
- **Vitest + Playwright**: ブラウザテスト環境

## 開発ワークフロー
Storybookがメインの開発環境として機能し、異なる迷路サイズ、カメラアングル、可視化機能を示す複数のストーリー例が用意されています。
