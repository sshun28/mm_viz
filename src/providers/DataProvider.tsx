import React, { useEffect, useRef, createContext, useContext } from 'react';
import { useDataStore } from '../stores/dataStore';
import { useTrajectoryAnimation } from '../hooks/useTrajectoryAnimation';
import type { MazeData, MouseState, TrajectoryProfile } from '../types';

// TrajectoryAnimationコンテキストの型定義
interface TrajectoryAnimationContextType {
  currentTimeRef: React.RefObject<number>;
  currentMouseStateRef: React.RefObject<MouseState>;
  updateMouseStateForTime: (time: number, trajectoryProfile: TrajectoryProfile, sortedTimestamps: number[]) => void;
  setCurrentTime: (time: number) => void;
}

// TrajectoryAnimationコンテキストの作成
const TrajectoryAnimationContext = createContext<TrajectoryAnimationContextType | null>(null);

export interface DataProviderProps {
  children: React.ReactNode;
  initialMazeData?: MazeData | null;
  initialMouseState?: MouseState;
  initialTrajectoryProfile?: TrajectoryProfile;
  initialTime?: number;
  initialSpeed?: number;
  initialLoopEnabled?: boolean;
}

export const DataProvider: React.FC<DataProviderProps> = ({
  children,
  initialMazeData = null,
  initialMouseState,
  initialTrajectoryProfile,
  initialTime = 0,
  initialSpeed = 1,
  initialLoopEnabled = false,
}) => {
  const setMazeData = useDataStore((state) => state.setMazeData);
  const setMouseState = useDataStore((state) => state.setMouseState);
  const setTrajectoryProfile = useDataStore((state) => state.setTrajectoryProfile);
  const setPlaybackSpeed = useDataStore((state) => state.setPlaybackSpeed);
  const setLoopEnabled = useDataStore((state) => state.setLoopEnabled);
  const clearAll = useDataStore((state) => state.clearAll);
  const isInitialized = useRef(false);

  // TrajectoryAnimationの共有refを作成
  const trajectoryAnimation = useTrajectoryAnimation();

  // Initialize data on mount
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      
      if (initialMazeData) {
        setMazeData(initialMazeData);
      }
      
      if (initialMouseState) {
        setMouseState(initialMouseState);
      }
      
      if (initialTrajectoryProfile) {
        setTrajectoryProfile(initialTrajectoryProfile);
        // Initialize the trajectory animation refs with first trajectory point
        const sortedTimestamps = Array.from(initialTrajectoryProfile.keys()).sort((a, b) => a - b);
        if (sortedTimestamps.length > 0) {
          const firstElement = initialTrajectoryProfile.get(sortedTimestamps[0]);
          if (firstElement && trajectoryAnimation.currentMouseStateRef.current) {
            trajectoryAnimation.currentMouseStateRef.current = { ...firstElement };
            trajectoryAnimation.setCurrentTime(sortedTimestamps[0]);
          }
        }
      }
      
      setPlaybackSpeed(initialSpeed);
      setLoopEnabled(initialLoopEnabled);
    }
  }, [
    initialMazeData, 
    initialMouseState, 
    initialTrajectoryProfile,
    initialTime,
    initialSpeed,
    initialLoopEnabled,
    setMazeData, 
    setMouseState,
    setTrajectoryProfile,
    setPlaybackSpeed,
    setLoopEnabled,
    trajectoryAnimation
  ]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Optional: Clear data on unmount
      // clearAll();
    };
  }, [clearAll]);

  return (
    <TrajectoryAnimationContext.Provider value={trajectoryAnimation}>
      {children}
    </TrajectoryAnimationContext.Provider>
  );
};

// TrajectoryAnimationコンテキストにアクセスするためのフック
export const useSharedTrajectoryAnimation = (): TrajectoryAnimationContextType => {
  const context = useContext(TrajectoryAnimationContext);
  if (!context) {
    throw new Error('useSharedTrajectoryAnimation must be used within a DataProvider');
  }
  return context;
};

// Export the useData hook for convenience
export const useData = useDataStore;