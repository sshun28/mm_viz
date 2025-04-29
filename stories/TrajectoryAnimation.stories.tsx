import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import MicromouseVisualizer from '../src/components/MicromouseVisualizer/MicromouseVisualizer';
import TrajectoryPath from '../src/components/MicromouseVisualizer/TrajectoryPath';
import PlaybackControls from '../src/components/MicromouseVisualizer/PlaybackControls';
import { TrajectoryProvider } from '../src/providers/TrajectoryProvider';
import { loadMazeFromUrl } from '../src/utils/mazeLoader';
import { MazeData, TrajectoryProfile, TrajectoryElement } from '../src/types';
import { CELL_SIZE } from '../src/config/constants';
import Mouse from '../src/components/MicromouseVisualizer/Mouse';

// マイクロマウスの軌跡をシミュレートするためのサンプルデータを作成
const createSampleTrajectoryProfile = (): TrajectoryProfile => {
    const profile = new Map<number, TrajectoryElement>();

    // 迷路のセルサイズを考慮
    const cellSize = CELL_SIZE;

    // スタート位置（左下のセル中心）
    const startX = cellSize / 2;
    const startY = cellSize / 2;

    // サンプル軌跡の生成
    // 簡単な動きのパターン: 最初に直進してから、右に曲がり、また直進
    let currentTime = 0;
    const dt = 0.1; // タイムステップ

    // 初期位置
    profile.set(currentTime, {
        position: { x: startX, y: startY },
        angle: Math.PI / 2 // 北向き
    });

    // 北に5マス直進
    for (let i = 0; i < 5; i++) {
        currentTime += dt;
        profile.set(currentTime, {
            position: { x: startX, y: startY + i * cellSize + cellSize * (currentTime - i * dt) / dt },
            angle: Math.PI / 2
        });
    }

    // 右に90度回転
    for (let i = 0; i < 10; i++) {
        currentTime += dt;
        profile.set(currentTime, {
            position: { x: startX, y: startY + 5 * cellSize },
            angle: Math.PI / 2 - (Math.PI / 2) * (i / 10)
        });
    }

    // 東に5マス直進
    for (let i = 0; i < 5; i++) {
        currentTime += dt;
        profile.set(currentTime, {
            position: { x: startX + i * cellSize + cellSize * (currentTime - (5 + 10) * dt - i * dt) / dt, y: startY + 5 * cellSize },
            angle: 0
        });
    }

    // 左に90度回転
    for (let i = 0; i < 10; i++) {
        currentTime += dt;
        profile.set(currentTime, {
            position: { x: startX + 5 * cellSize, y: startY + 5 * cellSize },
            angle: (Math.PI / 2) * (i / 10)
        });
    }

    // 北に5マス直進
    for (let i = 0; i < 5; i++) {
        currentTime += dt;
        profile.set(currentTime, {
            position: { x: startX + 5 * cellSize, y: startY + 5 * cellSize + i * cellSize + cellSize * (currentTime - (5 + 10 + 5 + 10) * dt - i * dt) / dt },
            angle: Math.PI / 2
        });
    }

    // 左に90度回転
    for (let i = 0; i < 10; i++) {
        currentTime += dt;
        profile.set(currentTime, {
            position: { x: startX + 5 * cellSize, y: startY + 10 * cellSize },
            angle: Math.PI / 2 + (Math.PI / 2) * (i / 10)
        });
    }

    // 西に5マス直進
    for (let i = 0; i < 5; i++) {
        currentTime += dt;
        profile.set(currentTime, {
            position: { x: startX + 5 * cellSize - i * cellSize - cellSize * (currentTime - (5 + 10 + 5 + 10 + 10) * dt - i * dt) / dt, y: startY + 10 * cellSize },
            angle: Math.PI
        });
    }

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
                try {
                    // サンプル迷路URLからデータをロード
                    const data = await loadMazeFromUrl('https://raw.githubusercontent.com/micromouseonline/mazefiles/refs/heads/master/classic/alljapan-033-2012-frsh-fin.txt');
                    setMazeData(data);
                } catch (error) {
                    console.error('迷路データのロードに失敗しました:', error);
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
                        <Mouse mouseState={{ position: { x: 0, y: 0 }, angle: Math.PI / 2 }} />
                        {/*<TrajectoryPath pastColor="#00aaff" showFutureTrajectory={true} futureColor="#aaaaaa" />*/}
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

// 将来の軌跡を非表示にしたバージョン
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
                        <Mouse mouseState={{ position: { x: 0, y: 0 }, angle: Math.PI / 2 }} />
                        <TrajectoryPath pastColor="#00aaff" showFutureTrajectory={false} />
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
                        <Mouse mouseState={{ position: { x: 0, y: 0 }, angle: Math.PI / 2 }} />
                        <TrajectoryPath pastColor="#ff6600" showFutureTrajectory={true} futureColor="#ffcc00" lineWidth={3} />
                    </MicromouseVisualizer>
                    <PlaybackControls controlPosition="top" showTimeDisplay={true} showSpeedControls={true} showSeekBar={true} />
                </TrajectoryProvider>
            </div>
        );
    },
};