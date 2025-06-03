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

### 状態管理とアニメーション
- **TrajectoryProvider**: コンテキストプロバイダで軌道再生状態を管理
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
- **TrajectoryProfile**: アニメーション用の時間インデックス付きマウス状態

## 設定とパフォーマンス
- **constants.ts**: セルサイズ、物理寸法、色の定義
- **Stats.js統合**: FPS追跡によるパフォーマンス監視
- **TypeScript**: 厳密な型チェックが有効
- **Vitest + Playwright**: ブラウザテスト環境

## 開発ワークフロー
Storybookがメインの開発環境として機能し、異なる迷路サイズ、カメラアングル、可視化機能を示す複数のストーリー例が用意されています。
