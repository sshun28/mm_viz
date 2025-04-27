import React from 'react'; // React のインポートを追加
import type { Meta, StoryObj } from '@storybook/react';
import MicromouseVisualizer from '../src/components/MicromouseVisualizer/MicromouseVisualizer';
import Mouse from '../src/components/MicromouseVisualizer/Mouse'; // Mouse をインポート
import CellMarker from '../src/components/MicromouseVisualizer/CellMarker'; // CellMarker をインポート
import TextLabel from '../src/components/MicromouseVisualizer/TextLabel'; // TextLabel をインポート
import { MazeData, MouseState } from '../src/types';
import { CELL_SIZE } from '../src/config/constants';

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


const sampleMazeData16 = createMazeData(16);
const sampleMazeData4 = createMazeData(4);

// スタート地点(0,0)の物理座標を計算
const startPhysicalPos16 = cellToPhysical(0, 0);
const startPhysicalPos4 = cellToPhysical(0, 0);

const sampleInitialMouseState16: MouseState = {
  position: startPhysicalPos16,
  angle: Math.PI / 2, // 北向き
};

const sampleInitialMouseState4: MouseState = {
  position: startPhysicalPos4,
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
    // initialMouseState を削除
    width: { control: 'number' },
    height: { control: 'number' },
    backgroundColor: { control: 'color' },
    showGridHelper: { control: 'boolean' },
    showAxesHelper: { control: 'boolean' },
    showStartMarker: { control: 'boolean' },
    showGoalMarkers: { control: 'boolean' },
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
    showStartMarker: true,
    showGoalMarkers: true,
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
      width: Default16x16.args.width,
      height: Default16x16.args.height,
      showGridHelper: Default16x16.args.showGridHelper,
      showAxesHelper: Default16x16.args.showAxesHelper,
      initialViewPreset: 'angle',
      backgroundColor: Default16x16.args.backgroundColor,
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
    // スタート/ゴールマーカーを非表示にして、独自のマーカーを追加
    showStartMarker: false,
    showGoalMarkers: false,
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
    showStartMarker: false,
    showGoalMarkers: false,
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