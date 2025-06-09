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
DataProvider (統一データ管理)
└── MicromouseVisualizer (メインコンテナ)
    ├── Maze (迷路の3D描画)
    ├── CameraController (カメラ制御・プリセット)
    └── 子コンポーネント (useDataフック経由でデータアクセス):
        ├── Mouse (3Dマウスモデル)
        ├── CellMarker (セルハイライト)
        ├── TextLabel (テキストオーバーレイ)
        ├── TrajectoryPath (軌道可視化)
        └── PlaybackControls (アニメーション制御)
```

### 状態管理とアニメーション
- **DataProvider**: Zustandベースの統一データ管理プロバイダ
  - `MazeData`: 迷路データの管理
  - `MouseState`: マウス位置・角度の管理
  - `CellMarkerData`: セルマーカーの管理
  - `TextLabelData`: テキストラベルの管理
- **useData**: データアクセス・更新用フック（Zustandストアへの直接アクセス）
- **TrajectoryProvider**: 軌道再生専用プロバイダ（軌道アニメーション機能）
- **useTrajectory**: 再生制御フック（再生/一時停止/シーク/速度調整）
- 時間ベースの補間により滑らかなマウス移動を実現
- 大きな軌道データセット用のバイナリサーチ最適化

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

// データの更新
const setMazeData = useData((state) => state.setMazeData);
const updateMouseState = useData((state) => state.updateMouseState);

// セルマーカーの管理
const addCellMarker = useData((state) => state.addCellMarker);
const updateCellMarker = useData((state) => state.updateCellMarker);
const removeCellMarker = useData((state) => state.removeCellMarker);
```

## 設定とパフォーマンス
- **constants.ts**: セルサイズ、物理寸法、色の定義
- **Stats.js統合**: FPS追跡によるパフォーマンス監視
- **TypeScript**: 厳密な型チェックが有効
- **Vitest + Playwright**: ブラウザテスト環境

## 開発ワークフロー
Storybookがメインの開発環境として機能し、異なる迷路サイズ、カメラアングル、可視化機能を示す複数のストーリー例が用意されています。
