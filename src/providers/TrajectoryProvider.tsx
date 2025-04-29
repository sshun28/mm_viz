import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MouseState, TrajectoryProfile, TrajectoryElement } from '../types';

// TrajectoryContextの型定義
interface TrajectoryContextType {
    // 現在の状態
    currentMouseState: MouseState;
    currentTime: number;
    isPlaying: boolean;
    duration: number;
    playbackSpeed: number;
    trajectoryProfile: TrajectoryProfile;  // 軌跡データ自体も提供

    // 制御関数
    play: () => void;
    pause: () => void;
    stop: () => void;
    seekTo: (time: number) => void;
    setPlaybackSpeed: (speed: number) => void;
}

// デフォルト値の設定
const defaultContext: TrajectoryContextType = {
    currentMouseState: { position: { x: 0, y: 0 }, angle: 0 },
    currentTime: 0,
    isPlaying: false,
    duration: 0,
    playbackSpeed: 1,
    trajectoryProfile: new Map(),
    play: () => { },
    pause: () => { },
    stop: () => { },
    seekTo: () => { },
    setPlaybackSpeed: () => { },
};

// コンテキストの作成
const TrajectoryContext = createContext<TrajectoryContextType>(defaultContext);

// TrajectoryProviderのProps
interface TrajectoryProviderProps {
    trajectoryProfile: TrajectoryProfile;
    initialTime?: number;
    initialSpeed?: number;
    children: React.ReactNode;
}

/**
 * 軌跡データと再生状態を管理するコンテキストプロバイダー
 * マウスの動きを時間に基づいて制御するための機能を提供します
 */
export const TrajectoryProvider: React.FC<TrajectoryProviderProps> = ({
    trajectoryProfile,
    initialTime = 0,
    initialSpeed = 1,
    children,
}) => {
    // 時間関連の状態
    const [currentTime, setCurrentTime] = useState<number>(initialTime);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [playbackSpeed, setPlaybackSpeed] = useState<number>(initialSpeed);

    // アニメーションフレーム管理用
    const animationFrameRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(performance.now());
    const currentTimeRef = useRef<number>(initialTime);

    // 更新間隔の制御（レンダリング最適化）
    const lastRenderTimeRef = useRef<number>(0);
    const RENDER_INTERVAL = 1000 / 30; // 30FPSでのレンダリング

    // プロファイルから時間の範囲を計算
    const sortedTimestamps = useSortedTimestamps(trajectoryProfile);
    const duration = useMemo(() => {
        return sortedTimestamps.length > 0 ? sortedTimestamps[sortedTimestamps.length - 1] : 0;
    }, [sortedTimestamps]);

    // 現在のマウス状態を計算（二分探索アルゴリズムを使用）
    const currentMouseState = useInterpolatedMouseState(trajectoryProfile, currentTime, sortedTimestamps);

    // 再生開始（メモ化により再レンダリングを最小化）
    const play = useCallback(() => {
        if (isPlaying) return;

        setIsPlaying(true);
        lastTimeRef.current = performance.now();

        // 最後まで到達していたら最初から再生
        if (currentTimeRef.current >= duration) {
            currentTimeRef.current = 0;
            setCurrentTime(0);
        }
    }, [isPlaying, duration]);

    // 一時停止
    const pause = useCallback(() => {
        setIsPlaying(false);
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
    }, []);

    // 停止（最初に戻る）
    const stop = useCallback(() => {
        setIsPlaying(false);
        currentTimeRef.current = 0;
        setCurrentTime(0);
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
    }, []);

    // 指定時間にシーク
    const seekTo = useCallback((time: number) => {
        const clampedTime = Math.max(0, Math.min(time, duration));
        currentTimeRef.current = clampedTime;
        setCurrentTime(clampedTime);
    }, [duration]);

    // 再生速度の設定
    const setSpeed = useCallback((speed: number) => {
        setPlaybackSpeed(Math.max(0.1, Math.min(10, speed)));
    }, []);

    // アニメーションループの最適化
    useEffect(() => {
        if (!isPlaying) return;

        const animate = (now: number) => {
            const deltaTime = (now - lastTimeRef.current) / 1000; // 秒単位に変換
            lastTimeRef.current = now;

            // 内部のrefを更新（Reactの状態更新を減らす）
            currentTimeRef.current += deltaTime * playbackSpeed;

            // ループ再生
            if (currentTimeRef.current >= duration) {
                currentTimeRef.current = 0;
            }

            // レンダリング間隔を制御（状態更新頻度を下げる）
            if (now - lastRenderTimeRef.current > RENDER_INTERVAL) {
                lastRenderTimeRef.current = now;
                setCurrentTime(currentTimeRef.current);
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        // クリーンアップ
        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isPlaying, playbackSpeed, duration]);

    // コンテキスト値のメモ化（再レンダリングを減らす）
    const contextValue = useMemo<TrajectoryContextType>(() => ({
        currentMouseState,
        currentTime,
        isPlaying,
        duration,
        playbackSpeed,
        trajectoryProfile,
        play,
        pause,
        stop,
        seekTo,
        setPlaybackSpeed: setSpeed,
    }), [
        currentMouseState,
        currentTime,
        isPlaying,
        duration,
        playbackSpeed,
        trajectoryProfile,
        play,
        pause,
        stop,
        seekTo,
        setSpeed
    ]);

    return (
        <TrajectoryContext.Provider value={contextValue}>
            {children}
        </TrajectoryContext.Provider>
    );
};

/**
 * TrajectoryProviderのコンテキスト値にアクセスするためのカスタムフック
 * このフックはTrajectoryProviderがツリーの上位に存在する場合にのみ使用できます
 */
export const useTrajectory = (): TrajectoryContextType | null => {
    const context = useContext(TrajectoryContext);

    if (context === undefined) {
        return null;
    }

    return context;
};

/**
 * TrajectoryProfileの時刻キーをソートして配列として返す
 */
function useSortedTimestamps(trajectoryProfile: TrajectoryProfile): number[] {
    return useMemo(() => {
        return Array.from(trajectoryProfile.keys()).sort((a, b) => a - b);
    }, [trajectoryProfile]);
}

/**
 * 二分探索で時間に対応するインデックスを検索する
 * 通常のforループよりも高速（O(log n)のアルゴリズム）
 */
function binarySearchTimeIndex(timestamps: number[], time: number): number {
    // timestamps配列内でtimeが入るべき位置を二分探索
    let left = 0;
    let right = timestamps.length - 1;

    // 端点のケース
    if (time <= timestamps[0]) return 0;
    if (time >= timestamps[right]) return right;

    // 二分探索
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);

        if (timestamps[mid] <= time && time < timestamps[mid + 1]) {
            return mid; // timeはtimestamps[mid]とtimestamps[mid+1]の間にある
        }

        if (timestamps[mid] < time) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    // 見つからない場合（通常はここに到達しない）
    return 0;
}

/**
 * 現在の時刻に対応するMouseStateを計算する
 * 指定した時刻の前後のキーフレーム間を線形補間して滑らかな動きを実現
 * 二分探索を使用して高速化
 */
function useInterpolatedMouseState(
    trajectoryProfile: TrajectoryProfile,
    currentTime: number,
    sortedTimestamps: number[]
): MouseState {
    return useMemo(() => {
        // プロファイルが空の場合はデフォルト値を返す
        if (sortedTimestamps.length === 0) {
            return { position: { x: 0, y: 0 }, angle: 0 };
        }

        // 時間が最小値以下の場合は最初の状態を返す
        if (currentTime <= sortedTimestamps[0]) {
            const firstElement = trajectoryProfile.get(sortedTimestamps[0])!;
            return {
                position: { ...firstElement.position },
                angle: firstElement.angle,
            };
        }

        // 時間が最大値以上の場合は最後の状態を返す
        if (currentTime >= sortedTimestamps[sortedTimestamps.length - 1]) {
            const lastElement = trajectoryProfile.get(sortedTimestamps[sortedTimestamps.length - 1])!;
            return {
                position: { ...lastElement.position },
                angle: lastElement.angle,
            };
        }

        // 二分探索で現在の時刻を挟む前後のキーフレームを効率的に見つける
        const beforeIndex = binarySearchTimeIndex(sortedTimestamps, currentTime);
        const beforeTime = sortedTimestamps[beforeIndex];
        const afterTime = sortedTimestamps[beforeIndex + 1];

        const beforeElement = trajectoryProfile.get(beforeTime)!;
        const afterElement = trajectoryProfile.get(afterTime)!;

        // 前後のキーフレーム間での位置の割合を計算
        const t = (currentTime - beforeTime) / (afterTime - beforeTime);

        // 線形補間で現在の位置と角度を計算
        return {
            position: {
                x: beforeElement.position.x + (afterElement.position.x - beforeElement.position.x) * t,
                y: beforeElement.position.y + (afterElement.position.y - beforeElement.position.y) * t,
            },
            angle: interpolateAngle(beforeElement.angle, afterElement.angle, t),
        };
    }, [trajectoryProfile, currentTime, sortedTimestamps]);
}

/**
 * 角度を線形補間する関数
 * 角度は-πからπの範囲にあるため、最短経路で補間する
 */
function interpolateAngle(a1: number, a2: number, t: number): number {
    // 角度の差を-πからπの範囲に正規化
    let diff = ((a2 - a1 + Math.PI * 3) % (Math.PI * 2)) - Math.PI;

    // 補間した角度を-πからπの範囲に正規化
    return ((a1 + diff * t + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
}