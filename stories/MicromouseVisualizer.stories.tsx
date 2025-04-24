import React from 'react'; // React のインポートを追加
import type { Meta, StoryObj } from '@storybook/react';
import MicromouseVisualizer from '../src/components/MicromouseVisualizer/MicromouseVisualizer';
import Mouse from '../src/components/MicromouseVisualizer/Mouse'; // Mouse をインポート
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
    backgroundColor: '#e0e0e0',
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