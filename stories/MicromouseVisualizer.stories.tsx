import type { Meta, StoryObj } from '@storybook/react';
import MicromouseVisualizer from '../src/components/MicromouseVisualizer/MicromouseVisualizer';
import { MazeData, MouseState } from '../src/types';
import { CELL_SIZE } from '../src/config/constants'; // CELL_SIZE をインポート

// --- Helper Function --- (MicromouseVisualizer.tsx と同じ定義に修正)
const cellToPhysical = (cellX: number, cellY: number): { x: number; y: number } => {
    const physicalX = cellX * CELL_SIZE + CELL_SIZE / 2;
    const physicalY = cellY * CELL_SIZE + CELL_SIZE / 2;
    return { x: physicalX, y: physicalY };
};

// --- サンプルデータ ---

// 16x16迷路データ生成ヘルパー
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

// スタート地点(0,0)の物理座標を計算 (mazeSize引数不要)
const startPhysicalPos16 = cellToPhysical(0, 0);
const startPhysicalPos4 = cellToPhysical(0, 0); // 4x4でも計算式は同じ

const sampleInitialMouseState16: MouseState = {
  position: startPhysicalPos16, // (CELL_SIZE/2, CELL_SIZE/2) が入るはず
  angle: Math.PI / 2, // 北向き
};

const sampleInitialMouseState4: MouseState = {
  position: startPhysicalPos4, // (CELL_SIZE/2, CELL_SIZE/2) が入るはず
  angle: Math.PI / 2, // 北向き
};


const meta = {
  title: 'Components/MicromouseVisualizer',
  component: MicromouseVisualizer,
  parameters: {
    // layout: 'centered', // 全画面表示の方が確認しやすいので解除
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    mazeData: { control: 'object' },
    initialMouseState: { control: 'object' },
    width: { control: 'number' },
    height: { control: 'number' },
    backgroundColor: { control: 'color' },
    showGridHelper: { control: 'boolean' },
    showAxesHelper: { control: 'boolean' },
    initialViewPreset: {
        control: { type: 'select' },
        options: ['top', 'angle', 'side'],
    },
  },
} satisfies Meta<typeof MicromouseVisualizer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default16x16: Story = {
  args: {
    mazeData: sampleMazeData16,
    initialMouseState: sampleInitialMouseState16, // 正しい物理座標を使用
    width: 800, // StorybookのCanvasサイズに合わせるか、指定する
    height: 600,
    showGridHelper: true, // デフォルトで表示
    showAxesHelper: true, // デフォルトで表示
    initialViewPreset: 'angle',
    backgroundColor: '#e0e0e0',
  },
};

export const TopView16x16: Story = {
    args: {
      ...Default16x16.args, // Defaultの引数を継承
      initialViewPreset: 'top',
    },
};

export const SideView16x16: Story = {
    args: {
      ...Default16x16.args,
      initialViewPreset: 'side',
    },
};


export const NoHelpers16x16: Story = {
    args: {
      ...Default16x16.args,
      showGridHelper: false,
      showAxesHelper: false,
    },
};

export const SmallMaze4x4: Story = {
    args: {
      ...Default16x16.args,
      mazeData: sampleMazeData4,
      initialMouseState: sampleInitialMouseState4, // 正しい物理座標を使用
      initialViewPreset: 'angle', // 小さい迷路でも角度付きビュー
    },
};

export const NoInitialMouse: Story = {
     args: {
      ...Default16x16.args,
      initialMouseState: undefined, // マウスを表示しないケース
    },
};

export const NoMazeData: Story = {
     args: {
      mazeData: undefined, // mazeDataがない場合（Loading表示の確認）
      initialMouseState: undefined,
      width: 400,
      height: 300,
      backgroundColor: '#cccccc',
    },
     // mazeDataがないとコンポーネントがエラーを出す可能性があるため、
     // Storybook上では最小限のデータを渡すか、argsを空にする
     // render: () => <MicromouseVisualizer width={400} height={300} backgroundColor="#cccccc" />
};