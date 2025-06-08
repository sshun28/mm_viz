import React, { useEffect, useState } from 'react'; // useState と useEffect を追加
import type { Meta, StoryObj } from '@storybook/react';
import MicromouseVisualizer from '../src/components/MicromouseVisualizer/MicromouseVisualizer';
import Mouse from '../src/components/MicromouseVisualizer/Mouse'; // Mouse をインポート
import CellMarker from '../src/components/MicromouseVisualizer/CellMarker'; // CellMarker をインポート
import TextLabel from '../src/components/MicromouseVisualizer/TextLabel'; // TextLabel をインポート
import { MazeData, MouseState, CameraViewPreset } from '../src/types';
import { CELL_SIZE } from '../src/config/constants';
import { loadMazeFromUrl, parseMazeFile } from '../src/utils/mazeLoader'; // 追加: マイクロマウス迷路読み込みユーティリティ
import { useCamera } from '../src/hooks/useCamera';

// --- Helper Function ---
// セル座標を物理座標に変換するヘルパー関数
const cellToPhysical = (cellX: number, cellY: number): { x: number; y: number } => {
    const physicalX = cellX * CELL_SIZE + CELL_SIZE / 2;
    const physicalY = cellY * CELL_SIZE + CELL_SIZE / 2;
    return { x: physicalX, y: physicalY };
};


// --- サンプルデータ ---

// 16x16迷路データ生成ヘルパー (変更なし)
const createMazeData = (size: number): MazeData => {
    const vwall: boolean[][] = Array(size).fill(null).map(() => Array(size + 1).fill(false));
    const hwall: boolean[][] = Array(size + 1).fill(null).map(() => Array(size).fill(false));

    // 外壁を設定
    for (let y = 0; y < size; y++) {
        vwall[y][0] = true; // 左端
        vwall[y][size] = true; // 右端
    }
    for (let x = 0; x < size; x++) {
        hwall[0][x] = true; // 上端
        hwall[size][x] = true; // 下端
    }

    // いくつか内壁を追加 (例)
    if (size >= 4) {
        hwall[1][1] = true;
        vwall[1][2] = true;
        hwall[2][1] = true;
    }
     if (size >= 8) {
        hwall[4][4] = true;
        hwall[4][5] = true;
        vwall[4][5] = true;
        vwall[5][5] = true;
    }


    // スタートとゴールを設定
    const start = { x: 0, y: 0 };
    const goalCells = Math.floor(size / 2); // 中央付近のセルをゴールに
    const goal = [
        { x: goalCells -1, y: goalCells -1 },
        { x: goalCells, y: goalCells -1 },
        { x: goalCells -1, y: goalCells },
        { x: goalCells, y: goalCells },
    ].filter(g => g.x >= 0 && g.x < size && g.y >= 0 && g.y < size); // 範囲外を除外

    return { size, walls: { vwall, hwall }, start, goal };
};

// 迷路ファイルのURL
const MAZE_FILE_URLS = {
  japan2023Hef: 'https://raw.githubusercontent.com/micromouseonline/mazefiles/refs/heads/master/halfsize/japan2023hef.txt',
  // 他の迷路ファイルも必要に応じて追加
};

// Mazeを動的に読み込むラッパーコンポーネント
interface DynamicMazeLoaderProps {
  url: string;
  children?: React.ReactNode;
  width?: number;
  height?: number;
  backgroundColor?: string;
  showGridHelper?: boolean;
  showAxesHelper?: boolean;
  showPerformanceStats?: boolean; // パフォーマンス表示のオプション
  showDiagonalGrid?: boolean; // 斜めグリッドを表示するかどうか
  initialViewPreset?: CameraViewPreset;
}

const DynamicMazeLoader: React.FC<DynamicMazeLoaderProps> = ({
  url,
  children,
  ...props
}) => {
  const [mazeData, setMazeData] = useState<MazeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadMaze = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await loadMazeFromUrl(url);
        setMazeData(data);
      } catch (err) {
        console.error('迷路ファイルの読み込み中にエラーが発生しました:', err);
        setError(err instanceof Error ? err.message : '迷路ファイルの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadMaze();
  }, [url]);

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>迷路データを読み込み中...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>エラー: {error}</div>;
  }

  if (!mazeData) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>迷路データが見つかりません</div>;
  }

  // スタート位置の物理座標を計算
  const startPhysicalPos = cellToPhysical(mazeData.start.x, mazeData.start.y);
  
  // 初期マウス状態
  const initialMouseState: MouseState = {
    position: startPhysicalPos,
    angle: Math.PI / 2, // 北向き
  };

  return (
    <MicromouseVisualizer
      mazeData={mazeData}
      {...props}
    >
      {children ? children : <Mouse mouseState={initialMouseState} />}
    </MicromouseVisualizer>
  );
};

// サンプルデータをそのまま残す（既存のストーリーはそのまま使えるように）
const sampleMazeData16 = createMazeData(16);
const sampleMazeData4 = createMazeData(4);

// スタート地点(0,0)の物理座標を計算
const startPhysicalPos16 = cellToPhysical(0, 0);
const startPhysicalPos4 = cellToPhysical(0, 0);
const startPhysicalPos32 = cellToPhysical(0, 0);

const sampleInitialMouseState16: MouseState = {
  position: startPhysicalPos16,
  angle: Math.PI / 2, // 北向き
};

const sampleInitialMouseState4: MouseState = {
  position: startPhysicalPos4,
  angle: Math.PI / 2, // 北向き
};

const sampleInitialMouseState32: MouseState = {
  position: startPhysicalPos32,
  angle: Math.PI / 2, // 北向き
};


// meta オブジェクトの型を明示的に指定
const meta: Meta<typeof MicromouseVisualizer> = {
  title: 'Components/MicromouseVisualizer',
  component: MicromouseVisualizer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    mazeData: { control: 'object' },
    width: { control: 'number' },
    height: { control: 'number' },
    backgroundColor: { control: 'color' },
    showGridHelper: { control: 'boolean' },
    showAxesHelper: { control: 'boolean' },
    showPerformanceStats: { control: 'boolean' }, // パフォーマンス表示コントロールを追加
    showDiagonalGrid: { control: 'boolean' }, // 斜めグリッド表示コントロールを追加
    initialViewPreset: {
        control: { type: 'select' },
        options: ['top', 'angle', 'side'],
    },
    children: { control: false }, // children は Storybook のコントロールでは設定しない
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// --- ストーリー定義 ---

// デフォルトのストーリー: 16x16 迷路とマウス
export const Default16x16: Story = {
  args: { // args にはコンポーネントの Props を指定
    mazeData: sampleMazeData16,
    width: 800,
    height: 600,
    showGridHelper: true,
    showAxesHelper: true,
    initialViewPreset: 'angle',
  },
  render: (args) => (
    <MicromouseVisualizer {...args}>
      <Mouse mouseState={sampleInitialMouseState16} />
    </MicromouseVisualizer>
  ),
};

// トップビュー
export const TopView16x16: Story = {
    args: {
      ...Default16x16.args, // Default の args を継承
      initialViewPreset: 'top',
    },
    render: Default16x16.render, // render 関数を再利用
};

// サイドビュー
export const SideView16x16: Story = {
    args: {
      ...Default16x16.args,
      initialViewPreset: 'side',
    },
    render: Default16x16.render,
};

// ヘルパー非表示
export const NoHelpers16x16: Story = {
    args: {
      ...Default16x16.args,
      showGridHelper: false,
      showAxesHelper: false,
    },
    render: Default16x16.render,
};

// 小さい迷路 (4x4)
export const SmallMaze4x4: Story = {
    args: {
      // Default16x16.args から必要な props のみコピー
      mazeData: sampleMazeData4,
      width: Default16x16.args!.width,
      height: Default16x16.args!.height,
      showGridHelper: Default16x16.args!.showGridHelper,
      showAxesHelper: Default16x16.args!.showAxesHelper,
      initialViewPreset: 'angle',
      backgroundColor: Default16x16.args!.backgroundColor,
    },
    render: (args) => (
        <MicromouseVisualizer {...args}>
          <Mouse mouseState={sampleInitialMouseState4} />
        </MicromouseVisualizer>
      ),
};

// マウスなし (children を渡さない)
export const NoMouse: Story = {
     args: {
      ...Default16x16.args, // Default の args を継承
      // initialMouseState: undefined, // 削除済み
    },
    render: (args) => (
        <MicromouseVisualizer {...args} />
      ),
};

// 迷路データなし (Loading 表示の確認)
export const NoMazeData: Story = {
     args: { // args にはコンポーネントの Props を指定
      mazeData: undefined,
      width: 400,
      height: 300,
      backgroundColor: '#cccccc',
      // 他の props はデフォルト値が使われる
    },
     render: (args) => (
        <MicromouseVisualizer {...args} />
      ),
};

// カスタムのCellMarkerを使用した例
export const WithCustomCellMarkers: Story = {
  args: {
    ...Default16x16.args,
  },
  render: (args) => (
    <MicromouseVisualizer {...args}>
      <Mouse mouseState={sampleInitialMouseState16} />
      {/* カスタムのスタートマーカー (円形) */}
      <CellMarker 
        cell={{ x: 0, y: 0 }}
        color="#00ff00"
        opacity={0.9}
        scale={0.7}
        type="circle"
      />
      {/* カスタムのゴールマーカー (ひし形) */}
      {sampleMazeData16.goal.map((goalCell, index) => (
        <CellMarker
          key={`custom-goal-${index}`}
          cell={goalCell}
          color="#ff00ff"
          opacity={0.8}
          scale={0.7}
          type="diamond"
          height={0.005} // 床から少し浮かせる
        />
      ))}
      {/* パスを示すマーカー */}
      <CellMarker cell={{ x: 1, y: 0 }} color="#0088ff" opacity={0.5} type="square" />
      <CellMarker cell={{ x: 1, y: 1 }} color="#0088ff" opacity={0.5} type="square" />
      <CellMarker cell={{ x: 2, y: 1 }} color="#0088ff" opacity={0.5} type="square" />
      <CellMarker cell={{ x: 3, y: 1 }} color="#0088ff" opacity={0.5} type="square" />
      <CellMarker cell={{ x: 3, y: 2 }} color="#0088ff" opacity={0.5} type="square" />
      <CellMarker cell={{ x: 3, y: 3 }} color="#0088ff" opacity={0.5} type="square" />
    </MicromouseVisualizer>
  ),
};

// TextLabelを使用した例を追加
export const WithTextLabels: Story = {
  args: {
    ...Default16x16.args,
  },
  render: (args) => (
    <MicromouseVisualizer {...args}>
      <Mouse mouseState={sampleInitialMouseState16} />
      
      {/* セル番号を表示 */}
      <TextLabel 
        cell={{ x: 0, y: 0 }} 
        text="Start" 
        color="#ffffff"
        backgroundColor="#008800" 
        fontSize={0.07}
        height={0.01}
      />
      
      {/* ゴールにラベルを表示 */}
      {sampleMazeData16.goal.map((goalCell, index) => (
        <TextLabel
          key={`goal-label-${index}`}
          cell={goalCell}
          text="Goal"
          color="#ffffff"
          backgroundColor="#880000"
          fontSize={0.07}
          height={0.01}
        />
      ))}
      
      {/* 距離情報を表示する例 */}
      <TextLabel cell={{ x: 1, y: 0 }} text="14" color="#aaaaff" fontSize={0.06} height={0.005} />
      <TextLabel cell={{ x: 1, y: 1 }} text="13" color="#aaaaff" fontSize={0.06} height={0.005} />
      <TextLabel cell={{ x: 2, y: 1 }} text="12" color="#aaaaff" fontSize={0.06} height={0.005} />
      <TextLabel cell={{ x: 3, y: 1 }} text="11" color="#aaaaff" fontSize={0.06} height={0.005} />
      <TextLabel cell={{ x: 3, y: 2 }} text="10" color="#aaaaff" fontSize={0.06} height={0.005} />
      <TextLabel cell={{ x: 3, y: 3 }} text="9" color="#aaaaff" fontSize={0.06} height={0.005} />
      
      {/* 斜めに配置した文字の例 */}
      <TextLabel 
        cell={{ x: 5, y: 5 }} 
        text="↑" 
        color="#ffff00" 
        fontSize={0.1}
        height={0.02}
        rotation={[0, 0, Math.PI / 2]} 
      />
      <TextLabel 
        cell={{ x: 6, y: 5 }} 
        text="→" 
        color="#ffff00" 
        fontSize={0.1}
        height={0.02}
      />
      <TextLabel 
        cell={{ x: 5, y: 6 }} 
        text="←" 
        color="#ffff00" 
        fontSize={0.1}
        height={0.02}
      />
      <TextLabel 
        cell={{ x: 6, y: 6 }} 
        text="↓" 
        color="#ffff00" 
        fontSize={0.1}
        height={0.02}
        rotation={[0, 0, -Math.PI / 2]} 
      />
    </MicromouseVisualizer>
  ),
};

// テキストラベルとマーカーを組み合わせた例
export const WithLabelsAndMarkers: Story = {
  args: {
    ...Default16x16.args,
  },
  render: (args) => (
    <MicromouseVisualizer {...args}>
      <Mouse mouseState={sampleInitialMouseState16} />
      
      {/* スタート位置のマーカーとラベル */}
      <CellMarker 
        cell={{ x: 0, y: 0 }}
        color="#00aa00"
        opacity={0.7}
        scale={0.8}
        type="square"
      />
      <TextLabel 
        cell={{ x: 0, y: 0 }} 
        text="S" 
        color="#ffffff" 
        fontSize={0.08}
        height={0.01}
      />
      
      {/* ゴール位置のマーカーとラベル */}
      {sampleMazeData16.goal.map((goalCell, index) => (
        <React.Fragment key={`goal-${index}`}>
          <CellMarker
            cell={goalCell}
            color="#aa0000"
            opacity={0.7}
            scale={0.8}
            type="square"
          />
          <TextLabel 
            cell={goalCell} 
            text="G" 
            color="#ffffff" 
            fontSize={0.08}
            height={0.01}
          />
        </React.Fragment>
      ))}
      
      {/* 探索済みセルを示す例 */}
      <CellMarker cell={{ x: 1, y: 0 }} color="#0088ff" opacity={0.3} type="square" />
      <CellMarker cell={{ x: 1, y: 1 }} color="#0088ff" opacity={0.3} type="square" />
      <CellMarker cell={{ x: 2, y: 1 }} color="#0088ff" opacity={0.3} type="square" />
      
      {/* 各セルの訪問回数を示す例 */}
      <TextLabel cell={{ x: 1, y: 0 }} text="2" color="#ffffff" fontSize={0.06} height={0.005} />
      <TextLabel cell={{ x: 1, y: 1 }} text="3" color="#ffffff" fontSize={0.06} height={0.005} />
      <TextLabel cell={{ x: 2, y: 1 }} text="1" color="#ffffff" fontSize={0.06} height={0.005} />
    </MicromouseVisualizer>
  ),
};

// 32x32の日本2023年ハーフサイズ迷路 - 動的読み込みに置き換え
export const Japan2023Hef32x32: Story = {
  args: {
    width: 1000,
    height: 800,
    showGridHelper: true,
    showAxesHelper: true,
    showPerformanceStats: false,
    showDiagonalGrid: true,
    initialViewPreset: 'angle',
  },
  render: (args) => (
    <DynamicMazeLoader 
      url={MAZE_FILE_URLS.japan2023Hef}
      {...args}
    />
  ),
};

// 32x32迷路のトップビュー - 動的読み込みに置き換え
export const Japan2023HefTopView: Story = {
  args: {
    ...Japan2023Hef32x32.args,
    initialViewPreset: 'top',
  },
  render: (args) => (
    <DynamicMazeLoader 
      url={MAZE_FILE_URLS.japan2023Hef}
      {...args}
    />
  ),
};

// 32x32迷路にカスタムマーカーと経路表示 - 動的読み込みに置き換え
export const Japan2023HefWithPath: Story = {
  args: {
    ...Japan2023Hef32x32.args,
  },
  render: (args) => {
    // この中で特定の経路を設定
    const [mazeData, setMazeData] = useState<MazeData | null>(null);
    
    useEffect(() => {
      // コンポーネントがマウントされたら迷路データを読み込む
      const fetchMaze = async () => {
        try {
          const data = await loadMazeFromUrl(MAZE_FILE_URLS.japan2023Hef);
          setMazeData(data);
        } catch (error) {
          console.error('迷路データの読み込みに失敗しました:', error);
        }
      };
      
      fetchMaze();
    }, []);
    
    if (!mazeData) {
      return <div>迷路データを読み込み中...</div>;
    }
    
    // スタート位置の物理座標を計算
    const startPhysicalPos = cellToPhysical(mazeData.start.x, mazeData.start.y);
    
    // 初期マウス状態
    const initialMouseState: MouseState = {
      position: startPhysicalPos,
      angle: Math.PI / 2, // 北向き
    };
    
    // サンプル経路の作成（実際の迷路データに基づいた経路ではありません）
    // 実際の迷路の壁を考慮した現実的な経路を生成するには、より複雑なアルゴリズムが必要です
    const samplePath = [
      {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}, {x: 4, y: 0}, {x: 5, y: 0},
      {x: 5, y: 1}, {x: 5, y: 2}, {x: 5, y: 3}, {x: 5, y: 4}, {x: 6, y: 4},
      {x: 7, y: 4}, {x: 8, y: 4}, {x: 9, y: 4}, {x: 10, y: 4}, {x: 10, y: 5},
      {x: 10, y: 6}, {x: 10, y: 7}, {x: 10, y: 8}, {x: 11, y: 8}, {x: 12, y: 8},
      {x: 12, y: 9}, {x: 12, y: 10}, {x: 12, y: 11}, {x: 13, y: 11}, {x: 14, y: 11},
      {x: 14, y: 12}, {x: 14, y: 13}, {x: 14, y: 14}, {x: 15, y: 14}, {x: 15, y: 15}
    ];
    
    return (
      <MicromouseVisualizer
        mazeData={mazeData}
        width={args.width}
        height={args.height}
        showGridHelper={args.showGridHelper}
        showAxesHelper={args.showAxesHelper}
        showPerformanceStats={args.showPerformanceStats}
        showDiagonalGrid={args.showDiagonalGrid}
        initialViewPreset={args.initialViewPreset}
        backgroundColor={args.backgroundColor}
      >
        <Mouse mouseState={initialMouseState} />
        
        {/* スタート位置のマーカーとラベル */}
        <CellMarker 
          cell={{ x: mazeData.start.x, y: mazeData.start.y }}
          color="#00ff00"
          opacity={0.8}
          scale={0.7}
          type="circle"
        />
        <TextLabel 
          cell={{ x: mazeData.start.x, y: mazeData.start.y }} 
          text="S" 
          color="#ffffff" 
          fontSize={0.06}
          height={0.01}
        />
        
        {/* ゴール位置のマーカーとラベル */}
        {mazeData.goal.map((goalCell, index) => (
          <React.Fragment key={`goal-${index}`}>
            <CellMarker
              cell={goalCell}
              color="#ff0000"
              opacity={0.7}
              scale={0.7}
              type="diamond"
            />
            <TextLabel 
              cell={goalCell} 
              text="G" 
              color="#ffffff" 
              fontSize={0.06}
              height={0.01}
            />
          </React.Fragment>
        ))}
        
        {/* サンプル経路の表示 */}
        {samplePath.map((cell, index) => (
          <CellMarker
            key={`path-${index}`}
            cell={cell}
            color="#3399ff"
            opacity={0.4}
            scale={0.6}
            type="square"
            height={0.001}
          />
        ))}
      </MicromouseVisualizer>
    );
  }
};


// カメラ操作ボタン付きのストーリー（useCameraフックを使用）
export const WithCameraControls: Story = {
  args: {
    ...Default16x16.args,
  },
  render: (args) => {
    const { cameraRef, setCameraView, resetCamera, toggleCameraProjection, zoomToRegion } = useCamera();

    return (
      <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
        {/* カメラ操作ボタンパネル */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
            Camera Controls
          </div>
          <button
            onClick={() => setCameraView('top')}
            style={{
              padding: '8px 12px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Top View
          </button>
          <button
            onClick={() => setCameraView('angle')}
            style={{
              padding: '8px 12px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Angle View
          </button>
          <button
            onClick={() => setCameraView('side')}
            style={{
              padding: '8px 12px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Side View
          </button>
          <button
            onClick={() => setCameraView('ortho')}
            style={{
              padding: '8px 12px',
              backgroundColor: '#9C27B0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Orthographic
          </button>
          <button
            onClick={() => resetCamera()}
            style={{
              padding: '8px 12px',
              backgroundColor: '#607D8B',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Reset Camera
          </button>
          <button
            onClick={toggleCameraProjection}
            style={{
              padding: '8px 12px',
              backgroundColor: '#795548',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Toggle Projection
          </button>
          <button
            onClick={() => zoomToRegion(0, 0, 0.27, 0.27)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#E91E63',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Zoom Start Area
          </button>
          <button
            onClick={() => zoomToRegion(0.54, 0.54, 0.81, 0.81)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#3F51B5',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Zoom Goal Area
          </button>
          <button
            onClick={() => zoomToRegion(1.08, 1.08, 1.35, 1.35)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#009688',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Zoom Corner
          </button>
        </div>

        {/* Visualizer with camera ref */}
        <MicromouseVisualizer {...args} cameraRef={cameraRef}>
          <Mouse mouseState={sampleInitialMouseState16} />
          
          {/* 座標検証用マーカー: 0.135, 0.135の位置 */}
          <mesh position={[0.135, 0.135, 0.02]}>
            <sphereGeometry args={[0.01, 16, 8]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          
          {/* 座標検証用マーカー: 0,0の位置（参考） */}
          <mesh position={[0, 0, 0.02]}>
            <sphereGeometry args={[0.01, 16, 8]} />
            <meshBasicMaterial color="#00ff00" />
          </mesh>
          
          {/* 座標検証用マーカー: 0.27, 0.27の位置（参考） */}
          <mesh position={[0.27, 0.27, 0.02]}>
            <sphereGeometry args={[0.01, 16, 8]} />
            <meshBasicMaterial color="#0000ff" />
          </mesh>
        </MicromouseVisualizer>
      </div>
    );
  },
};

// 動的読み込みを使用した日本2023年ハーフサイズ迷路
export const Japan2023HefDynamic: Story = {
  args: {
    width: 1000,
    height: 800,
    showGridHelper: true,
    showAxesHelper: true,
    showPerformanceStats: false,
    showDiagonalGrid: true,
    initialViewPreset: 'angle',
  },
  render: (args) => (
    <DynamicMazeLoader 
      url={MAZE_FILE_URLS.japan2023Hef}
      {...args}
    />
  ),
};

// 動的読み込みを使用した日本2023年ハーフサイズ迷路（トップビュー）
export const Japan2023HefDynamicTopView: Story = {
  args: {
    ...Japan2023HefDynamic.args,
    initialViewPreset: 'top',
  },
  render: (args) => (
    <DynamicMazeLoader 
      url={MAZE_FILE_URLS.japan2023Hef}
      {...args}
    />
  ),
};

// 動的読み込みを使用した日本2023年ハーフサイズ迷路（カスタムマーカー付き）
export const Japan2023HefDynamicWithPath: Story = {
  args: {
    ...Japan2023HefDynamic.args,
  },
  render: (args) => {
    // この中で特定の経路を設定
    const [mazeData, setMazeData] = useState<MazeData | null>(null);
    
    useEffect(() => {
      // コンポーネントがマウントされたら迷路データを読み込む
      const fetchMaze = async () => {
        try {
          const data = await loadMazeFromUrl(MAZE_FILE_URLS.japan2023Hef);
          setMazeData(data);
        } catch (error) {
          console.error('迷路データの読み込みに失敗しました:', error);
        }
      };
      
      fetchMaze();
    }, []);
    
    if (!mazeData) {
      return <div>迷路データを読み込み中...</div>;
    }
    
    // スタート位置の物理座標を計算
    const startPhysicalPos = cellToPhysical(mazeData.start.x, mazeData.start.y);
    
    // 初期マウス状態
    const initialMouseState: MouseState = {
      position: startPhysicalPos,
      angle: Math.PI / 2, // 北向き
    };
    
    // サンプル経路の作成（実際の迷路データに基づいた経路ではありません）
    // 実際の迷路の壁を考慮した現実的な経路を生成するには、より複雑なアルゴリズムが必要です
    const samplePath = [
      {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}, {x: 4, y: 0}, {x: 5, y: 0},
      {x: 5, y: 1}, {x: 5, y: 2}, {x: 5, y: 3}, {x: 5, y: 4}, {x: 6, y: 4},
      {x: 7, y: 4}, {x: 8, y: 4}, {x: 9, y: 4}, {x: 10, y: 4}, {x: 10, y: 5},
      {x: 10, y: 6}, {x: 10, y: 7}, {x: 10, y: 8}, {x: 11, y: 8}, {x: 12, y: 8},
      {x: 12, y: 9}, {x: 12, y: 10}, {x: 12, y: 11}, {x: 13, y: 11}, {x: 14, y: 11},
      {x: 14, y: 12}, {x: 14, y: 13}, {x: 14, y: 14}, {x: 15, y: 14}, {x: 15, y: 15}
    ];
    
    return (
      <MicromouseVisualizer
        mazeData={mazeData}
        width={args.width}
        height={args.height}
        showGridHelper={args.showGridHelper}
        showAxesHelper={args.showAxesHelper}
        showPerformanceStats={args.showPerformanceStats}
        showDiagonalGrid={args.showDiagonalGrid}
        initialViewPreset={args.initialViewPreset}
        backgroundColor={args.backgroundColor}
      >
        <Mouse mouseState={initialMouseState} />
        
        {/* スタート位置のマーカーとラベル */}
        <CellMarker 
          cell={{ x: mazeData.start.x, y: mazeData.start.y }}
          color="#00ff00"
          opacity={0.8}
          scale={0.7}
          type="circle"
        />
        <TextLabel 
          cell={{ x: mazeData.start.x, y: mazeData.start.y }} 
          text="S" 
          color="#ffffff" 
          fontSize={0.06}
          height={0.01}
        />
        
        {/* ゴール位置のマーカーとラベル */}
        {mazeData.goal.map((goalCell, index) => (
          <React.Fragment key={`goal-${index}`}>
            <CellMarker
              cell={goalCell}
              color="#ff0000"
              opacity={0.7}
              scale={0.7}
              type="diamond"
            />
            <TextLabel 
              cell={goalCell} 
              text="G" 
              color="#ffffff" 
              fontSize={0.06}
              height={0.01}
            />
          </React.Fragment>
        ))}
        
        {/* サンプル経路の表示 */}
        {samplePath.map((cell, index) => (
          <CellMarker
            key={`path-${index}`}
            cell={cell}
            color="#3399ff"
            opacity={0.4}
            scale={0.6}
            type="square"
            height={0.001}
          />
        ))}
      </MicromouseVisualizer>
    );
  }
};
