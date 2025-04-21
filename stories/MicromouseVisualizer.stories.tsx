import type { Meta, StoryObj } from '@storybook/react';
import MicromouseVisualizer from '../src/components/MicromouseVisualizer/MicromouseVisualizer'; // 相対パスを確認
import { MazeData } from '../src/types'; // Import MazeData type

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


const sampleInitialMouseState = {
  // positionはセルのインデックス (0-indexed)
  position: { x: 0, y: 0 }, // スタート地点のセル(0,0)
  angle: Math.PI / 2, // 初期向き (Y軸正方向 = 北 = -Z方向 in Three.js)
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
    initialMouseState: sampleInitialMouseState,
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
      initialMouseState: { // スタート位置も合わせる
          position: { x: 0, y: 0 },
          angle: Math.PI / 2,
      },
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