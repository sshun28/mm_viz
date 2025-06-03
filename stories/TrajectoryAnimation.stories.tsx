import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import MicromouseVisualizer from '../src/components/MicromouseVisualizer/MicromouseVisualizer';
import TrajectoryPath from '../src/components/MicromouseVisualizer/TrajectoryPath';
import PlaybackControls from '../src/components/MicromouseVisualizer/PlaybackControls';
import { TrajectoryProvider } from '../src/providers/TrajectoryProvider';
import { loadMazeFromUrl } from '../src/utils/mazeLoader';
import { MazeData, TrajectoryProfile, TrajectoryElement } from '../src/types';
import { CELL_SIZE } from '../src/config/constants';
import TrajectoryAnimationController from '../src/components/MicromouseVisualizer/TrajectoryAnimationController';
import Mouse from '../src/components/MicromouseVisualizer/Mouse';
import { sampleTrajectoryProfile } from './trajectory_profile';

// マイクロマウスの軌跡をシミュレートするためのサンプルデータを作成
const createSampleTrajectoryProfile = (): TrajectoryProfile => {
    let first_time = [...sampleTrajectoryProfile.keys()][0]
    let profile = new Map<number, TrajectoryElement>();
    sampleTrajectoryProfile.forEach((value, key) => {
        profile.set((key - first_time) / 1000000, value);
    });

    return profile;
};

// meta オブジェクト
const meta: Meta<typeof MicromouseVisualizer> = {
    title: 'Trajectory/AnimatedVisualization',
    component: MicromouseVisualizer,
    parameters: {
        layout: 'fullscreen',
    },
    tags: ['autodocs'],
    argTypes: {
        width: { control: 'number' },
        height: { control: 'number' },
        backgroundColor: { control: 'color' },
        showGridHelper: { control: 'boolean' },
        showAxesHelper: { control: 'boolean' },
        showPerformanceStats: { control: 'boolean' }, // パフォーマンス表示のコントロールを追加
        initialViewPreset: {
            control: { type: 'select' },
            options: ['top', 'angle', 'side', 'ortho'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

// サンプルの軌跡とともに表示するストーリー
export const WithSampleTrajectory: Story = {
    args: {
        width: 800,
        height: 600,
        showGridHelper: true,
        showAxesHelper: true,
        showPerformanceStats: true, // パフォーマンス統計を有効化
        initialViewPreset: 'angle',
    },
    render: (args) => {
        // 16x16の迷路
        const [mazeData, setMazeData] = useState<MazeData | null>(null);

        // コンポーネントのマウント時にサンプル迷路を読み込む
        React.useEffect(() => {
            const loadMaze = async () => {
                // デフォルトの空の迷路データを作成
                const emptyMaze: MazeData = {
                    size: 16,
                    walls: {
                        vwall: Array(16).fill(null).map(() => Array(17).fill(false)),
                        hwall: Array(17).fill(null).map(() => Array(16).fill(false)),
                    },
                    start: { x: 0, y: 0 },
                    goal: [{ x: 7, y: 7 }, { x: 8, y: 7 }, { x: 7, y: 8 }, { x: 8, y: 8 }],
                };
                // 外壁を設定
                for (let y = 0; y < 16; y++) {
                    emptyMaze.walls.vwall[y][0] = true; // 左端
                    emptyMaze.walls.vwall[y][16] = true; // 右端
                }
                for (let x = 0; x < 16; x++) {
                    emptyMaze.walls.hwall[0][x] = true; // 上端
                    emptyMaze.walls.hwall[16][x] = true; // 下端
                }
                setMazeData(emptyMaze);
            };

            loadMaze();
        }, []);

        // サンプルの軌跡データ
        const trajectoryProfile = createSampleTrajectoryProfile();

        if (!mazeData) {
            return <div>迷路データを読み込み中...</div>;
        }

        return (
            <div style={{ position: 'relative', width: args.width, height: args.height }}>
                <TrajectoryProvider trajectoryProfile={trajectoryProfile} initialSpeed={1}>
                    <MicromouseVisualizer
                        mazeData={mazeData}
                        width={args.width}
                        height={args.height}
                        showGridHelper={args.showGridHelper}
                        showAxesHelper={args.showAxesHelper}
                        showPerformanceStats={args.showPerformanceStats} // パフォーマンス統計の表示を渡す
                        initialViewPreset={args.initialViewPreset}
                        backgroundColor={args.backgroundColor}
                    >
                        <TrajectoryAnimationController />
                        <Mouse mouseState={{ position: { x: 0, y: 0 }, angle: Math.PI / 2 }} />
                        {<TrajectoryPath pastColor="#00aaff" />}
                    </MicromouseVisualizer>
                    <PlaybackControls showTimeDisplay={true} showSpeedControls={true} showSeekBar={true} />
                </TrajectoryProvider>
            </div>
        );
    },
};

// トップビューでの表示
export const TopViewWithTrajectory: Story = {
    args: {
        ...WithSampleTrajectory.args,
        initialViewPreset: 'top',
    },
    render: WithSampleTrajectory.render,
};

// 標準的な軌跡表示のストーリー
export const TrajectoryWithoutFuture: Story = {
    args: {
        ...WithSampleTrajectory.args,
        showPerformanceStats: true, // パフォーマンス統計を有効化
    },
    render: (args) => {
        // 16x16の迷路
        const [mazeData, setMazeData] = useState<MazeData | null>(null);

        // コンポーネントのマウント時にサンプル迷路を読み込む
        React.useEffect(() => {
            const loadMaze = async () => {
                try {
                    // サンプル迷路URLからデータをロード
                    const data = await loadMazeFromUrl('https://raw.githubusercontent.com/micromouseonline/mazefiles/refs/heads/master/classic/japan2007ef.txt');
                    setMazeData(data);
                } catch (error) {
                    console.error('迷路データのロードに失敗しました:', error);
                    // エラー処理（省略）
                }
            };

            loadMaze();
        }, []);

        // サンプルの軌跡データ
        const trajectoryProfile = createSampleTrajectoryProfile();

        if (!mazeData) {
            return <div>迷路データを読み込み中...</div>;
        }

        return (
            <div style={{ position: 'relative', width: args.width, height: args.height }}>
                <TrajectoryProvider trajectoryProfile={trajectoryProfile} initialSpeed={1}>
                    <MicromouseVisualizer
                        mazeData={mazeData}
                        width={args.width}
                        height={args.height}
                        showGridHelper={args.showGridHelper}
                        showAxesHelper={args.showAxesHelper}
                        showPerformanceStats={args.showPerformanceStats} // パフォーマンス統計の表示を渡す
                        initialViewPreset={args.initialViewPreset}
                        backgroundColor={args.backgroundColor}
                    >
                        <TrajectoryAnimationController />
                        <TrajectoryPath pastColor="#00aaff" />
                    </MicromouseVisualizer>
                    <PlaybackControls showTimeDisplay={true} showSpeedControls={true} showSeekBar={true} />
                </TrajectoryProvider>
            </div>
        );
    },
};

// カスタマイズされたコントロールパネル
export const CustomizedControls: Story = {
    args: {
        ...WithSampleTrajectory.args,
        showPerformanceStats: true, // パフォーマンス統計を有効化
    },
    render: (args) => {
        // 16x16の迷路
        const [mazeData, setMazeData] = useState<MazeData | null>(null);

        // コンポーネントのマウント時にサンプル迷路を読み込む
        React.useEffect(() => {
            const loadMaze = async () => {
                try {
                    // サンプル迷路URLからデータをロード
                    const data = await loadMazeFromUrl('https://raw.githubusercontent.com/micromouseonline/mazefiles/refs/heads/master/classic/japan2007ef.txt');
                    setMazeData(data);
                } catch (error) {
                    console.error('迷路データのロードに失敗しました:', error);
                    // エラー処理（省略）
                }
            };

            loadMaze();
        }, []);

        // サンプルの軌跡データ
        const trajectoryProfile = createSampleTrajectoryProfile();

        if (!mazeData) {
            return <div>迷路データを読み込み中...</div>;
        }

        return (
            <div style={{ position: 'relative', width: args.width, height: args.height }}>
                <TrajectoryProvider trajectoryProfile={trajectoryProfile} initialSpeed={2}>
                    <MicromouseVisualizer
                        mazeData={mazeData}
                        width={args.width}
                        height={args.height}
                        showGridHelper={args.showGridHelper}
                        showAxesHelper={args.showAxesHelper}
                        showPerformanceStats={args.showPerformanceStats} // パフォーマンス統計の表示を渡す
                        initialViewPreset={args.initialViewPreset}
                        backgroundColor={args.backgroundColor}
                    >
                        <TrajectoryAnimationController />
                        <TrajectoryPath pastColor="#ff6600" lineWidth={3} />
                    </MicromouseVisualizer>
                    <PlaybackControls controlPosition="top" showTimeDisplay={true} showSpeedControls={true} showSeekBar={true} />
                </TrajectoryProvider>
            </div>
        );
    },
};