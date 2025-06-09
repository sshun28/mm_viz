import React, { useEffect, useRef } from 'react';
import { useDataStore } from '../stores/dataStore';
import type { MazeData, MouseState } from '../types';

export interface DataProviderProps {
  children: React.ReactNode;
  initialMazeData?: MazeData | null;
  initialMouseState?: MouseState;
}

export const DataProvider: React.FC<DataProviderProps> = ({
  children,
  initialMazeData = null,
  initialMouseState,
}) => {
  const setMazeData = useDataStore((state) => state.setMazeData);
  const setMouseState = useDataStore((state) => state.setMouseState);
  const clearAll = useDataStore((state) => state.clearAll);
  const isInitialized = useRef(false);

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
    }
  }, [initialMazeData, initialMouseState, setMazeData, setMouseState]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Optional: Clear data on unmount
      // clearAll();
    };
  }, [clearAll]);

  return <>{children}</>;
};

// Export the useData hook for convenience
export const useData = useDataStore;