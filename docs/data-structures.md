# 3. データ構造

各データ構造の型定義は [`src/types/index.ts`](../src/types/index.ts) および [`src/stores/dataStore.ts`](../src/stores/dataStore.ts) を参照してください。

## 3.1 DataProvider管理データ

### 3.1.1 迷路データ形式 (`MazeData`)
迷路のサイズ、壁の配置、スタート・ゴール地点の情報を含みます。

**アクセス方法:**
```tsx
const mazeData = useData((state) => state.mazeData);
const setMazeData = useData((state) => state.setMazeData);
const updateMazeData = useData((state) => state.updateMazeData);
```

### 3.1.2 マウス状態データ形式 (`MouseState`)
マウスの物理的な位置と角度を定義します。

**アクセス方法:**
```tsx
const mouseState = useData((state) => state.mouseState);
const setMouseState = useData((state) => state.setMouseState);
const updateMouseState = useData((state) => state.updateMouseState);
```

### 3.1.3 セルマーカーデータ形式 (`CellMarkerData`)
セルマーカーの表示データを管理します。

**データ構造:**
```tsx
interface CellMarkerData {
  id: string;              // 一意識別子
  cell: CellPosition;      // セル位置 {x, y}
  color?: string;          // 表示色
  visible?: boolean;       // 表示/非表示
}
```

**アクセス方法:**
```tsx
const cellMarkers = useData((state) => state.cellMarkers);
const addCellMarker = useData((state) => state.addCellMarker);
const updateCellMarker = useData((state) => state.updateCellMarker);
const removeCellMarker = useData((state) => state.removeCellMarker);
const clearCellMarkers = useData((state) => state.clearCellMarkers);
```

### 3.1.4 テキストラベルデータ形式 (`TextLabelData`)
テキストラベルの表示データを管理します。

**データ構造:**
```tsx
interface TextLabelData {
  id: string;                           // 一意識別子
  text: string;                         // 表示テキスト
  position: [number, number, number];   // 3D座標 [x, y, z]
  visible?: boolean;                    // 表示/非表示
}
```

**アクセス方法:**
```tsx
const textLabels = useData((state) => state.textLabels);
const addTextLabel = useData((state) => state.addTextLabel);
const updateTextLabel = useData((state) => state.updateTextLabel);
const removeTextLabel = useData((state) => state.removeTextLabel);
const clearTextLabels = useData((state) => state.clearTextLabels);
```

## 3.2 TrajectoryProvider管理データ

### 3.2.1 マウスアニメーション用プロファイル (`TrajectoryProfile`)
時刻ごとのマウスの位置と角度を記録したデータ形式です。

**アクセス方法:**
```tsx
const { currentMouseState, currentTime, isPlaying } = useTrajectory();
```

## 3.3 データ管理パターン

### 3.3.1 初期化パターン
```tsx
<DataProvider 
  initialMazeData={mazeData}
  initialMouseState={initialMouseState}
>
  <MicromouseVisualizer>
    <Mouse />
  </MicromouseVisualizer>
</DataProvider>
```

### 3.3.2 動的更新パターン
```tsx
const ExampleComponent = () => {
  const updateMouseState = useData((state) => state.updateMouseState);
  const addCellMarker = useData((state) => state.addCellMarker);
  
  const handleClick = () => {
    // マウス位置を更新
    updateMouseState({ position: { x: 0.45, y: 0.45 } });
    
    // セルマーカーを追加
    addCellMarker({
      id: 'marker1',
      cell: { x: 5, y: 5 },
      color: '#ff0000',
      visible: true
    });
  };
  
  return <button onClick={handleClick}>Update Data</button>;
};
```

### 3.3.3 クリーンアップパターン
```tsx
const clearAll = useData((state) => state.clearAll);

// 全データをクリア
clearAll();
```
