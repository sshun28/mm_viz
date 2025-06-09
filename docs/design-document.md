# マイクロマウスビジュアライザー設計ドキュメント

## 1. 概要

### 1.1 プロジェクトの目的
このプロジェクトは、マイクロマウスの迷路探索をリアルタイムで可視化するためのReactコンポーネントを提供することを目的としています。マイクロマウスの動きや探索アルゴリズムの挙動を直感的に理解しやすくするツールを構成するためのコンポーネントライブラリです。

### 1.2 主要な機能
- マイクロマウスの迷路の3D表示
- 迷路内に配置するオブジェクト（マウス、軌跡など）の描画基盤
- 壁や経路の視覚的表現
- カメラコントロール（ズーム、回転、パン）

### 1.3 技術スタック
- **React**: UIコンポーネント構築
- **TypeScript**: 型安全な開発
- **Three.js/React Three Fiber**: 3Dレンダリング
- **React Three Drei**: Three.jsの便利なヘルパー
- **Storybook**: コンポーネント開発・テスト環境

## 2. コンポーネント構成

### 2.1 MicromouseVisualizer（メインコンポーネント）
メインのコンテナコンポーネント。3Dシーンのセットアップ、迷路の描画、カメラ制御を担当します。迷路データは `DataProvider` 経由で取得し、迷路内に表示する他の要素（マウス、軌跡など）は `children` として受け取ります。

**Props:**
- `width?: number`: コンポーネントの幅 (デフォルト: 800)。
- `height?: number`: コンポーネントの高さ (デフォルト: 600)。
- `backgroundColor?: string`: 背景色 (デフォルト: '#f0f0f0')。
- `showGridHelper?: boolean`: グリッドヘルパーの表示/非表示 (デフォルト: false)。
- `showAxesHelper?: boolean`: 軸ヘルパーの表示/非表示 (デフォルト: false)。
- `initialViewPreset?: CameraViewPreset`: 初期カメラビュープリセット (デフォルト: 'angle')。
- `children?: React.ReactNode`: 迷路内に描画する追加のReact要素（例: `<Mouse />`, `<Trajectory />`）。

**データ取得:**
- 迷路データは `useData((state) => state.mazeData)` で取得。
- データが `null` の場合はローディング表示。

### 2.2 サブコンポーネント (MicromouseVisualizer 内部)
#### 2.2.1 Maze
- `mazeData: MazeData` を prop として受け取る（MicromouseVisualizerから渡される）。
- 迷路の床・柱・壁を描画。
- 壁の存在有無を視覚的に表現。
- スタート地点とゴール地点を強調表示。

#### 2.2.2 CameraController
- `initialViewPreset: CameraViewPreset`, `mazeSize: number`, `target: [number, number, number]` を prop として受け取る。
- OrbitControls を使用したカメラ操作を提供。
- プリセットビューへの切り替え機能。
- カメラのターゲットを迷路の中心に設定。

### 2.3 描画要素コンポーネント (children として渡す想定)
#### 2.3.1 Mouse
- `mouseState?: MouseState` をオプション prop として受け取る。
- prop が提供されない場合は `useData((state) => state.mouseState)` でDataProviderからデータを取得。
- 優先順位: props > DataProvider > デフォルト値
- マウスの3Dモデルを描画。
- `mouseState` に基づいて位置と向きを更新。
- 移動アニメーションは上位コンポーネントまたは状態管理ライブラリで制御。

#### 2.3.2 Trajectory (将来実装)
- 軌跡を描画。
- 節点と線で描画。
- カラーマップ機能。

### 2.4 ControlPanel (ライブラリ外部)
このコンポーネントライブラリの範疇外。利用側で実装することを想定。
- アニメーション速度調整
- 表示/非表示設定

## 3. データ構造とデータ管理

### 3.1 統一データ管理（DataProvider）
プロジェクトでは **Zustand** ベースの統一データ管理を採用しています：

- **DataProvider**: アプリケーション全体の状態管理を担当するコンテキストプロバイダ
- **useData**: Zustandストアへの直接アクセスを提供するフック
- **データ種別**:
  - `MazeData`: 迷路データ（壁配置、スタート/ゴール位置）
  - `MouseState`: マウスの位置・角度
  - `CellMarkerData`: セルマーカーの表示データ（ID、位置、色、表示状態）
  - `TextLabelData`: テキストラベルの表示データ（ID、テキスト、3D位置、表示状態）

### 3.2 使用パターン
```tsx
// データの読み取り
const mazeData = useData((state) => state.mazeData);
const mouseState = useData((state) => state.mouseState);

// データの更新
const setMazeData = useData((state) => state.setMazeData);
const updateMouseState = useData((state) => state.updateMouseState);

// セルマーカーの管理
const addCellMarker = useData((state) => state.addCellMarker);
```

詳細は [データ構造](./data-structures.md) を参照してください。

## 4. 主要な機能の実装方針

### 4.0 座標系

本ビジュアライザーでは以下の座標系を定義する。

- **セル座標**: 迷路のマス目を表す整数座標 (x, y)。左下のマスが (0, 0) となり、右に行くほどxが増加、奥に行くほどyが増加する。
- **物理座標**: Three.js空間内のメートル単位の座標 (x, y, z)。
    - **原点**: `MicromouseVisualizer` コンポーネント内の3Dシーンの原点 (0, 0, 0) は、迷路の最も左下にある区画（セル(0,0)）の、さらに左手前（-X, -Y方向）のコーナーに対応する。`Maze` コンポーネントはこの原点を基準に描画される。
    - **XY平面**: 迷路の床面と平行な平面。
    - **Z軸**: 床面に対して垂直上向きを正とする。
    - **セルと物理座標の関係**: セル座標 (cx, cy) の中心に対応する物理座標は `(cx * CELL_SIZE + CELL_SIZE / 2, cy * CELL_SIZE + CELL_SIZE / 2, 0)` となる。
    - **マウスの状態**: `MouseState` の `position` は、迷路の原点 (左下隅) を基準とした物理座標 (x, y) を示す。`Mouse` コンポーネントはこの座標に基づいて自身の位置を設定する。

### 4.1 迷路の描画方法 (`Maze` コンポーネント)
- 床面は1つの直方体として描画。
- 壁はFBXモデルを読み込み、InstancedMesh を使用して描画。
- 柱もFBXモデルを読み込み、InstancedMesh を使用して描画。

### 4.2 マウスの動きのアニメーション
- `MicromouseVisualizer` はマウスの状態 (`MouseState`) を直接管理しない。
- **静的表示**: `DataProvider` の `initialMouseState` でマウスの初期位置を設定。
- **動的アニメーション**: 
  - `TrajectoryProvider` と `useTrajectory` を使用した軌道再生（推奨）
  - または `useData((state) => state.updateMouseState)` による手動更新
- アニメーションロジック（状態の更新、補間など）は、`MicromouseVisualizer` を利用する側のアプリケーションで実装する。

### 4.3 壁の表現方法 (`Maze` コンポーネント)
- 外壁と内壁を区別して描画。
- （将来）発見済み/未発見の壁の表示を区別（色や透明度）。

### 4.4 カメラ制御 (`CameraController` コンポーネント)
- OrbitControlsを使用した自由なカメラ操作。
- プリセットビュー（トップビュー、斜めビュー等）。
- 迷路サイズに応じた自動ズーム調整（ターゲットを迷路中心に設定）。

## 5. インターフェース設計

詳細は [インターフェース設計](./interface-design.md) を参照してください。

## 6. 拡張性と今後の計画

### 6.1 カスタマイズオプション
- **描画要素の追加**: `children` prop を通じて、ユーザー定義の3Dオブジェクトを迷路内に追加可能。
- **マウスモデルの変更**: `Mouse` コンポーネント自体を差し替えるか、`Mouse` コンポーネントにモデル指定の prop を追加することで対応可能。

### 6.2 パフォーマンス最適化
- **描画の最適化**:
  - インスタンシングによる壁・柱の描画。
- **レンダリング設定**:
  - WebGLレンダラーの設定調整（アンチエイリアス、シャドウなど）。

## 7. テスト計画

詳細は [テスト計画](./testing-plan.md) を参照してください。

## 8. 実装スケジュール (更新)

### 8.1 フェーズ1：基本機能実装 (完了)
- **迷路レンダリング**:
  - 基本的な床面と壁・柱の描画 (`Maze` コンポーネント)
  - グリッド/軸ヘルパーの実装
- **マウス表示**:
  - 基本的な3Dモデルの実装 (`Mouse` コンポーネント)
  - 位置・角度の設定機能 (`mouseState` prop)
- **カメラコントロール**:
  - OrbitControlsの実装 (`CameraController` コンポーネント)
  - プリセットビューの実装
- **コンポーネント構造**:
  - `MicromouseVisualizer` が `children` を受け入れるように変更

### 8.2 フェーズ2：インタラクティブ機能 (ライブラリ外部/利用側)
- **アニメーション制御**:
  - 時系列プロファイルのロード機能
  - データプロバイダーとカスタムフック機能
    - `TrajectoryProvider`: 軌跡データと再生状態を管理するコンテキストプロバイダー
    - `useTrajectory`: プロバイダー内部の状態とコントロール関数にアクセスするカスタムフック
  - 再生制御関数の提供:
    - 再生・一時停止・停止機能
    - シーク機能（時間指定ジャンプ）
    - 速度調整機能
  - 時間インデックス付きのマウス状態插補計算
- **軌跡表示**:
  - `Trajectory` コンポーネントの実装 (children として渡す)
  - データプロバイダーコンテキストからの状態取得
  - 時系列データに基づく軌跡の可視化（過去／予測軌跡の表現）

#### 8.2.1 データプロバイダーパターンの設計

##### DataProvider（統一データ管理）
- **DataProvider コンポーネント**:
  - Props:
    - `initialMazeData?: MazeData`: 初期迷路データ
    - `initialMouseState?: MouseState`: 初期マウス状態
    - `children: ReactNode`: 子コンポーネント
  - 機能:
    - Zustandベースの統一状態管理
    - マウス状態、迷路データ、マーカー、ラベルの管理
    - リアルタイムデータ更新サポート

- **useData フック**:
  - 返却値: Zustandストアへの直接アクセス
  - 読み取り: `useData((state) => state.mazeData)`
  - 更新: `useData((state) => state.setMazeData)`

##### TrajectoryProvider（軌道アニメーション専用）
- **TrajectoryProvider コンポーネント**:
  - Props:
    - `trajectoryProfile: TrajectoryProfile`: 時系列のマウス状態プロファイル
    - `initialTime?: number`: 初期表示時間
    - `initialSpeed?: number`: 初期再生速度
    - `children: ReactNode`: 子コンポーネント
  - 提供する機能:
    - マウス状態の時間補間処理
    - 再生ループ（requestAnimationFrame）の管理
    - 時系列ステート管理
  
- **useTrajectory フック**:
  - 返却値:
    - `currentMouseState: MouseState`: 現在のマウス状態
    - `currentTime: number`: 現在の再生時間
    - `isPlaying: boolean`: 再生中かどうか
    - `duration: number`: 全体の再生時間
    - `playbackSpeed: number`: 再生速度
    - `play(): void`: 再生開始
    - `pause(): void`: 一時停止
    - `stop(): void`: 停止（初期状態に戻る）
    - `seekTo(time: number): void`: 指定時間にジャンプ
    - `setPlaybackSpeed(speed: number): void`: 再生速度設定

- **利用パターン**:
  ```tsx
  // 基本的な使用例（DataProviderのみ）
  const App = () => {
    const mazeData = /* 迷路データ */;
    const initialMouseState = /* 初期マウス状態 */;
    
    return (
      <DataProvider 
        initialMazeData={mazeData}
        initialMouseState={initialMouseState}
      >
        <div className="container">
          <MicromouseVisualizer>
            <Mouse />
            <CellMarker cell={{x: 0, y: 0}} color="#ff0000" />
          </MicromouseVisualizer>
        </div>
      </DataProvider>
    );
  };

  // 軌道アニメーション使用例（DataProvider + TrajectoryProvider）
  const AnimatedApp = () => {
    const trajectoryProfile = /* プロファイルデータ */;
    
    return (
      <DataProvider initialMazeData={mazeData}>
        <TrajectoryProvider trajectoryProfile={trajectoryProfile}>
          <div className="container">
            <MicromouseVisualizer>
              <AnimatedMouse />
              <TrajectoryPath />
            </MicromouseVisualizer>
            <PlaybackControls />
          </div>
        </TrajectoryProvider>
      </DataProvider>
    );
  };

  // AnimatedMouseは内部でuseTrajectoryを使用
  const AnimatedMouse = () => {
    const { currentMouseState } = useTrajectory();
    return <Mouse mouseState={currentMouseState} />;
  };

  // 再生コントロールもuseTrajectoryを使用
  const PlaybackControls = () => {
    const { play, pause, seekTo, currentTime, duration, isPlaying } = useTrajectory();
    // コントロールUI実装
  };
  ```

### 8.3 フェーズ3：高度な機能と最適化
- **パフォーマンス最適化**:
  - 大規模迷路への対応
- **拡張機能**:
  - 複数マウス表示 (複数の `<Mouse>` を children として渡す)

## 9. 参考情報

詳細は [参考情報](./reference.md) を参照してください。
