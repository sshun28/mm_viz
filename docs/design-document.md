# マイクロマウスビジュアライザー設計ドキュメント

## 1. 概要

### 1.1 プロジェクトの目的
このプロジェクトは、マイクロマウスの迷路探索をリアルタイムで可視化するためのReactコンポーネントを提供することを目的としています。マイクロマウスの動きや探索アルゴリズムの挙動を直感的に理解しやすくするツールを構成するためのコンポーネントライブラリです。

### 1.2 主要な機能
- マイクロマウスの迷路の3D表示
- マウスの動きのリアルタイムアニメーション
- 壁や経路の視覚的表現
- 探索アルゴリズムの進行状況の可視化
- カメラコントロール（ズーム、回転、パン）

### 1.3 技術スタック
- **React**: UIコンポーネント構築
- **TypeScript**: 型安全な開発
- **Three.js/React Three Fiber**: 3Dレンダリング
- **React Three Drei**: Three.jsの便利なヘルパー
- **Storybook**: コンポーネント開発・テスト環境

## 2. コンポーネント構成

### 2.1 MicromouseVisualizer（メインコンポーネント）
メインのコンテナコンポーネント。迷路、マウス、コントロールパネルを統合し、状態管理を行います。

### 2.2 サブコンポーネント
#### 2.2.1 MazeRenderer
- 迷路の床・柱・壁を描画
- 壁の存在有無を視覚的に表現
- スタート地点とゴール地点を強調表示
- 壁、床のクリックハンドラ

#### 2.2.2 MouseRenderer
- マウスの3Dモデルを描画
- 位置と向きの更新
- 移動アニメーション

#### 2.2.3 TrajectoryRenderer
- 軌跡を描画
- 節点と線で描画
- カラーマップ機能

#### 2.2.4 ControlPanel
このコンポーネントライブラリの範疇にいれるべきかどうかは要検討

- アニメーション速度調整
- 表示/非表示設定

## 3. データ構造

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


## 4. 主要な機能の実装方針

### 4.1 迷路の描画方法
- 床面は1つの直方体として描画
  - 迷路のサイズに応じてスケーリング
- 壁はFBXモデルを読み込んで描画
- テクスチャでグリッドラインを描画

### 4.2 マウスの動きのアニメーション
- スムーズなアニメーション
- 時系列プロファイルを読み込んで描画
- 速度倍率指定機能（数値で倍率を指定）
- 再生・停止・シーク・ステップなどの一般的な再生制御

### 4.3 壁の表現方法
- 外壁と内壁を区別して描画
- 発見済み/未発見の壁の表示を区別（色や透明度）
- 仮想壁（アルゴリズムが想定する壁）と実壁の区別

### 4.4 カメラ制御
- OrbitControlsを使用した自由なカメラ操作
- プリセットビュー（トップビュー、斜めビュー等）
- 迷路サイズに応じた自動ズーム調整
- OrthoカメラとPerspectiveカメラの切り替え機能
- Orthoの場合はTopViewに固定する機能

## 5. インターフェース設計

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

## 6. 拡張性と今後の計画

### 6.1 カスタマイズオプション
- **マウスの表現**：
  - FBXフォーマットの3Dモデルを指定して読み込める機能
- **UIコントロール**：
  - コントロールパネルの表示/非表示
  - コントロールボタンのサイズ、配置のカスタマイズ

### 6.2 パフォーマンス最適化
- **描画の最適化**：
  - インスタンシングによる壁の描画（同一形状の多数の壁を効率的に描画）
- **レンダリング設定**：
  - WebGLレンダラーの設定調整（アンチエイリアス、シャドウなど）
- **計算処理の最適化**：
  - 迷路サイズに応じた描画更新間隔の調整

## 7. テスト計画

ほぼ自分専用ライブラリなのでそこまで綿密なテストは不要

### 7.1 単体テスト
- **コンポーネントテスト**：
  - 各コンポーネント（MazeRenderer, MouseRenderer, TrajectoryRenderer）の独立した動作確認
  - メソッドの動作確認（setCameraView, setMouseStateなど）
- **データ処理テスト**：
  - 迷路データの正しい解釈と描画
  - 軌跡データの時系列に沿った適切な処理
  - 座標変換（迷路座標⇔物理座標）の精度確認

### 7.2 統合・可視化テスト
- **Storybookを活用したビジュアルテスト**：
  - さまざまな迷路サイズとデータでのレンダリング確認
  - ウィンドウサイズに対するレスポンシブ対応の検証
- **インタラクションテスト**：
  - マウス操作（クリック、ドラッグ）の応答性
  - キーボードショートカットの動作確認
- **アニメーションテスト**：
  - 異なる速度設定での動作確認
  - ステップ実行とシークの精度確認
  - 長時間再生時の安定性

### 7.3 クロスブラウザテスト
- 主要ブラウザ(Chrome)での動作確認

## 8. 実装スケジュール

### 8.1 フェーズ1：基本機能実装
- **迷路レンダリング**：
  - 基本的な床面と壁の描画
  - グリッドヘルパーの実装
  - 外壁と内壁の表現
  - スタート・ゴール位置の表示
- **マウス表示**：
  - 基本的な3Dモデルの実装
  - 位置・角度の設定機能
- **カメラコントロール**：
  - OrbitControlsの実装
  - プリセットビューの実装（トップ、斜め、サイド）
  - 視点のリセット機能

### 8.2 フェーズ2：インタラクティブ機能
- **アニメーション制御**：
  - 時系列プロファイルのロード機能
  - 再生・一時停止・停止機能
  - ステップ実行機能
  - 速度調整機能
- **データ操作**：
  - 迷路データのロード・保存機能
  - 座標のクリック検出と操作
  - 壁の追加・削除機能
- **軌跡表示**：
  - 移動軌跡の描画
  - 探索履歴の視覚化
  - カラーマッピングによる情報表示

### 8.3 フェーズ3：高度な機能と最適化
- **高度なアニメーション**：
  - スムーズな補間アニメーション
  - 加速・減速などの動きの表現
  - カメラ追従機能
- **パフォーマンス最適化**：
  - インスタンシングの実装
  - レンダリング設定の最適化
  - 大規模迷路への対応
- **拡張機能**：
  - 複数マウス表示
  - 迷路エディタ機能

### 8.4 実装の優先順位と依存関係
1. **コアコンポーネント**：
   - MazeRenderer → MouseRenderer → TrajectoryRenderer
2. **制御機能**：
   - カメラコントロール → アニメーション制御
3. **インタラクション**：
   - データロード → イベントハンドラ → 編集機能
4. **最適化と拡張**：
   - パフォーマンステスト → 最適化 → 拡張機能

## 9. 参考情報

### 9.1 マイクロマウス競技ルール
- **標準的な迷路サイズ**：16x16マスまたは32x32マスの正方形迷路が基本
- **壁の配置ルール**：
  - 外周は全て壁で囲まれている
  - 内壁は垂直または水平に配置
  - 一つのセルは最大4つの壁（北、東、南、西）で囲まれる
- **スタートとゴール位置**：
  - スタートは通常、左下（南西）の角
  - ゴールは大会毎に指定される

### 9.2 関連技術資料
- **Three.js/React Three Fiber**：
  - [Three.js公式ドキュメント](https://threejs.org/docs/)
  - [React Three Fiber入門ガイド](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)
  - [React Three Dreiコンポーネント一覧](https://github.com/pmndrs/drei)
