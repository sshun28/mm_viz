import React, { createContext, useContext, useRef, useCallback, useMemo } from 'react';
import { MouseState, TrajectoryProfile } from '../types';

// TrajectoryContextの型定義
interface TrajectoryContextType {
    // 現在の状態（refで管理）
    trajectoryProfileRef: React.RefObject<TrajectoryProfile>;
    currentTimeRef: React.RefObject<number>;
    isPlayingRef: React.RefObject<boolean>;
    durationRef: React.RefObject<number>;
    playbackSpeedRef: React.RefObject<number>;
    currentMouseStateRef: React.RefObject<MouseState>;
    sortedTimestampsRef: React.RefObject<number[]>;

    // 制御関数
    play: () => void;
    pause: () => void;
    stop: () => void;
    seekTo: (time: number) => void;
    setPlaybackSpeed: (speed: number) => void;
    updateMouseStateForTime: (time: number) => void; // 追加
}

// デフォルト値の設定
const defaultContext: TrajectoryContextType = {
    trajectoryProfileRef: { current: new Map() },
    currentTimeRef: { current: 0 },
    isPlayingRef: { current: false },
    durationRef: { current: 0 },
    playbackSpeedRef: { current: 1 },
    currentMouseStateRef: { current: { position: { x: 0, y: 0 }, angle: 0 } },
    sortedTimestampsRef: { current: [] },
    play: () => { },
    pause: () => { },
    stop: () => { },
    seekTo: () => { },
    setPlaybackSpeed: () => { },
    updateMouseStateForTime: () => { }, // 追加
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
 * useStateを使用せず、refを使用して状態を管理することでR3Fコンポーネントの不要な再描画を防ぎます
 */
export const TrajectoryProvider: React.FC<TrajectoryProviderProps> = ({
    trajectoryProfile,
    initialTime = 0,
    initialSpeed = 1,
    children,
}) => {
    // すべての状態をrefで管理（useStateを使わない）
    const trajectoryProfileRef = useRef<TrajectoryProfile>(trajectoryProfile);
    const currentTimeRef = useRef<number>(initialTime);
    const isPlayingRef = useRef<boolean>(false);
    const playbackSpeedRef = useRef<number>(initialSpeed);
    const currentMouseStateRef = useRef<MouseState>({ position: { x: 0, y: 0 }, angle: 0 });
    
    // ソートされたタイムスタンプのキャッシュ
    const sortedTimestampsRef = useRef<number[]>(
        Array.from(trajectoryProfile.keys()).sort((a, b) => a - b)
    );
    
    // 時間範囲を計算
    const durationRef = useRef<number>(
        sortedTimestampsRef.current.length > 0 
            ? sortedTimestampsRef.current[sortedTimestampsRef.current.length - 1] 
            : 0
    );

    // 再生開始
    const play = useCallback(() => {
        if (isPlayingRef.current) return;

        // 最後まで到達していたら最初から再生
        if (currentTimeRef.current >= durationRef.current) {
            currentTimeRef.current = 0;
        }
        
        isPlayingRef.current = true;
    }, []);

    // 一時停止
    const pause = useCallback(() => {
        isPlayingRef.current = false;
    }, []);

    // 停止（最初に戻る）
    const stop = useCallback(() => {
        isPlayingRef.current = false;
        currentTimeRef.current = 0;
        
        // 現在のマウス状態を更新（先頭のマウス状態に）
        if (sortedTimestampsRef.current.length > 0) {
            const firstElement = trajectoryProfileRef.current.get(sortedTimestampsRef.current[0]);
            if (firstElement) {
                currentMouseStateRef.current = {
                    position: { ...firstElement.position },
                    angle: firstElement.angle,
                };
            }
        }
    }, []);

    // 指定時間にシーク
    const seekTo = useCallback((time: number) => {
        const clampedTime = Math.max(0, Math.min(time, durationRef.current));
        currentTimeRef.current = clampedTime;
        
        // マウス状態も更新
        updateMouseStateForTime(clampedTime);
    }, []);

    // 再生速度の設定
    const setPlaybackSpeed = useCallback((speed: number) => {
        playbackSpeedRef.current = Math.max(0.1, Math.min(10, speed));
    }, []);

    // 現在の時間に対応するマウス状態を計算する関数
    const updateMouseStateForTime = useCallback((time: number) => {
        const timestamps = sortedTimestampsRef.current;
        const profile = trajectoryProfileRef.current;
        
        // プロファイルが空の場合はデフォルト値
        if (timestamps.length === 0) {
            currentMouseStateRef.current = { position: { x: 0, y: 0 }, angle: 0 };
            return;
        }
        
        // 時間が最小値以下の場合は最初の状態
        if (time <= timestamps[0]) {
            const firstElement = profile.get(timestamps[0])!;
            currentMouseStateRef.current = {
                position: { ...firstElement.position },
                angle: firstElement.angle,
            };
            return;
        }
        
        // 時間が最大値以上の場合は最後の状態
        if (time >= timestamps[timestamps.length - 1]) {
            const lastElement = profile.get(timestamps[timestamps.length - 1])!;
            currentMouseStateRef.current = {
                position: { ...lastElement.position },
                angle: lastElement.angle,
            };
            return;
        }
        
        // 二分探索で現在の時刻を挟む前後のキーフレームを効率的に見つける
        const beforeIndex = binarySearchTimeIndex(timestamps, time);
        const beforeTime = timestamps[beforeIndex];
        const afterTime = timestamps[beforeIndex + 1];
        
        const beforeElement = profile.get(beforeTime)!;
        const afterElement = profile.get(afterTime)!;
        
        // 前後のキーフレーム間での位置の割合を計算
        const t = (time - beforeTime) / (afterTime - beforeTime);
        
        // 線形補間で現在の位置と角度を計算
        currentMouseStateRef.current = {
            position: {
                x: beforeElement.position.x + (afterElement.position.x - beforeElement.position.x) * t,
                y: beforeElement.position.y + (afterElement.position.y - beforeElement.position.y) * t,
            },
            angle: interpolateAngle(beforeElement.angle, afterElement.angle, t),
        };
    }, []);

    // コンテキスト値のメモ化
    const contextValue = useMemo<TrajectoryContextType>(() => ({
        trajectoryProfileRef,
        currentTimeRef,
        isPlayingRef,
        durationRef,
        playbackSpeedRef,
        currentMouseStateRef,
        sortedTimestampsRef,
        play,
        pause,
        stop,
        seekTo,
        setPlaybackSpeed,
        updateMouseStateForTime, // 追加
    }), [
        play,
        pause,
        stop,
        seekTo,
        setPlaybackSpeed,
        updateMouseStateForTime // 追加
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
export const useTrajectory = (): TrajectoryContextType => {
    const context = useContext(TrajectoryContext);
    
    if (context === undefined) {
        throw new Error('useTrajectory must be used within a TrajectoryProvider');
    }
    
    return context;
};

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
 * 角度を線形補間する関数
 * 角度は-πからπの範囲にあるため、最短経路で補間する
 */
function interpolateAngle(a1: number, a2: number, t: number): number {
    // 角度の差を-πからπの範囲に正規化
    let diff = ((a2 - a1 + Math.PI * 3) % (Math.PI * 2)) - Math.PI;

    // 補間した角度を-πからπの範囲に正規化
    return ((a1 + diff * t + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
}