import { create } from 'zustand';
import type { MazeData, MouseState, CellPosition } from '../types';

export interface CellMarkerData {
  id: string;
  cell: CellPosition;
  color?: string;
  visible?: boolean;
}

export interface TextLabelData {
  id: string;
  text: string;
  position: [number, number, number];
  visible?: boolean;
}

interface DataStore {
  // Maze data
  mazeData: MazeData | null;
  setMazeData: (data: MazeData | null) => void;
  updateMazeData: (updates: Partial<MazeData>) => void;

  // Mouse state
  mouseState: MouseState;
  setMouseState: (state: MouseState) => void;
  updateMouseState: (updates: Partial<MouseState>) => void;

  // Cell markers
  cellMarkers: Map<string, CellMarkerData>;
  addCellMarker: (marker: CellMarkerData) => void;
  updateCellMarker: (id: string, updates: Partial<CellMarkerData>) => void;
  removeCellMarker: (id: string) => void;
  clearCellMarkers: () => void;

  // Text labels
  textLabels: Map<string, TextLabelData>;
  addTextLabel: (label: TextLabelData) => void;
  updateTextLabel: (id: string, updates: Partial<TextLabelData>) => void;
  removeTextLabel: (id: string) => void;
  clearTextLabels: () => void;

  // Clear all data
  clearAll: () => void;
}

const initialMouseState: MouseState = {
  position: { x: 0, y: 0 },
  angle: 0,
};

export const useDataStore = create<DataStore>((set) => ({
  // Maze data
  mazeData: null,
  setMazeData: (data) => set({ mazeData: data }),
  updateMazeData: (updates) =>
    set((state) => ({
      mazeData: state.mazeData ? { ...state.mazeData, ...updates } : null,
    })),

  // Mouse state
  mouseState: initialMouseState,
  setMouseState: (state) => set({ mouseState: state }),
  updateMouseState: (updates) =>
    set((state) => ({
      mouseState: { ...state.mouseState, ...updates },
    })),

  // Cell markers
  cellMarkers: new Map(),
  addCellMarker: (marker) =>
    set((state) => {
      const newMarkers = new Map(state.cellMarkers);
      newMarkers.set(marker.id, marker);
      return { cellMarkers: newMarkers };
    }),
  updateCellMarker: (id, updates) =>
    set((state) => {
      const newMarkers = new Map(state.cellMarkers);
      const existing = newMarkers.get(id);
      if (existing) {
        newMarkers.set(id, { ...existing, ...updates });
      }
      return { cellMarkers: newMarkers };
    }),
  removeCellMarker: (id) =>
    set((state) => {
      const newMarkers = new Map(state.cellMarkers);
      newMarkers.delete(id);
      return { cellMarkers: newMarkers };
    }),
  clearCellMarkers: () => set({ cellMarkers: new Map() }),

  // Text labels
  textLabels: new Map(),
  addTextLabel: (label) =>
    set((state) => {
      const newLabels = new Map(state.textLabels);
      newLabels.set(label.id, label);
      return { textLabels: newLabels };
    }),
  updateTextLabel: (id, updates) =>
    set((state) => {
      const newLabels = new Map(state.textLabels);
      const existing = newLabels.get(id);
      if (existing) {
        newLabels.set(id, { ...existing, ...updates });
      }
      return { textLabels: newLabels };
    }),
  removeTextLabel: (id) =>
    set((state) => {
      const newLabels = new Map(state.textLabels);
      newLabels.delete(id);
      return { textLabels: newLabels };
    }),
  clearTextLabels: () => set({ textLabels: new Map() }),

  // Clear all data
  clearAll: () =>
    set({
      mazeData: null,
      mouseState: initialMouseState,
      cellMarkers: new Map(),
      textLabels: new Map(),
    }),
}));