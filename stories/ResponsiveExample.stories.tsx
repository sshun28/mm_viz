import React, { useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import MicromouseVisualizer from '../src/components/MicromouseVisualizer/MicromouseVisualizer';
import { loadMazeFromUrl } from '../src/utils/mazeLoader';
import { MazeData } from '../src/types';

const meta: Meta<typeof MicromouseVisualizer> = {
  title: 'Examples/Responsive',
  component: MicromouseVisualizer,
};

export default meta;
type Story = StoryObj<typeof MicromouseVisualizer>;

// 迷路データをロードするヘルパーコンポーネント
const MazeLoader: React.FC<{ children: (mazeData: MazeData | null) => React.ReactNode }> = ({ children }) => {
  const [mazeData, setMazeData] = useState<MazeData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadMaze = async () => {
      try {
        // 16x16のシンプルな迷路データを生成
        const size = 16;
        const walls = {
          vwall: Array.from({ length: size }, () =>
            Array.from({ length: size + 1 }, () => false)
          ),
          hwall: Array.from({ length: size + 1 }, () =>
            Array.from({ length: size }, () => false)
          ),
        };
        
        // 外壁を設定
        for (let i = 0; i < size; i++) {
          walls.vwall[i][0] = true;
          walls.vwall[i][size] = true;
          walls.hwall[0][i] = true;
          walls.hwall[size][i] = true;
        }
        
        // いくつかの内壁を追加
        walls.vwall[5][5] = true;
        walls.vwall[5][6] = true;
        walls.hwall[5][5] = true;
        walls.hwall[6][5] = true;
        
        const mazeData: MazeData = {
          size,
          walls,
          start: { x: 0, y: 0 },
          goal: { x: size / 2 - 1, y: size / 2 - 1 }
        };
        
        setMazeData(mazeData);
      } catch (error) {
        console.error('Failed to load maze:', error);
      } finally {
        setLoading(false);
      }
    };
    loadMaze();
  }, []);
  
  if (loading) {
    return <div style={{ padding: '20px' }}>Loading maze data...</div>;
  }
  
  return <>{children(mazeData)}</>;
};

// インラインスタイルを使ったレスポンシブデザインの例
export const ResponsiveFullScreen: Story = {
  render: () => (
    <MazeLoader>
      {(mazeData) => (
        <div style={{ width: '100vw', height: '100vh', padding: '20px', backgroundColor: '#f0f0f0' }}>
          <MicromouseVisualizer 
            mazeData={mazeData}
            showGridHelper={true}
            style={{
              borderRadius: '8px',
              border: '1px solid #ddd',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }}
          />
        </div>
      )}
    </MazeLoader>
  ),
};

// カスタムサイズの例
export const CustomSizeExample: Story = {
  render: () => (
    <MazeLoader>
      {(mazeData) => (
        <div style={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#e0e0e0' }}>
          <MicromouseVisualizer 
            mazeData={mazeData}
            showGridHelper={true}
            width="600px"
            height="400px"
            style={{
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              border: '2px solid #4a5568',
            }}
          />
        </div>
      )}
    </MazeLoader>
  ),
};

// モバイルレスポンシブの例
export const MobileResponsive: Story = {
  render: () => (
    <MazeLoader>
      {(mazeData) => (
        <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <header style={{ backgroundColor: '#1f2937', color: 'white', padding: '16px', flexShrink: 0 }}>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Micromouse Visualizer</h1>
          </header>
          <main style={{ flex: 1, padding: '8px', backgroundColor: '#f9fafb', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '8px', left: '8px', right: '8px', bottom: '8px' }}>
              <MicromouseVisualizer 
                mazeData={mazeData}
                showGridHelper={true}
                style={{
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}
              />
            </div>
          </main>
        </div>
      )}
    </MazeLoader>
  ),
};

// Grid レイアウトの例
export const GridLayout: Story = {
  render: () => (
    <MazeLoader>
      {(mazeData) => (
        <div style={{ width: '100%', height: '100vh', padding: '16px', backgroundColor: '#f3f4f6', overflow: 'hidden' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '16px', 
            height: '100%' 
          }}>
            <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', flexShrink: 0 }}>Top View</h2>
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                  <MicromouseVisualizer 
                    mazeData={mazeData}
                    showGridHelper={true}
                    initialViewPreset="top"
                    style={{
                      borderRadius: '8px',
                      border: '1px solid #d1d5db'
                    }}
                  />
                </div>
              </div>
            </div>
            <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', flexShrink: 0 }}>3D View</h2>
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                  <MicromouseVisualizer 
                    mazeData={mazeData}
                    showGridHelper={true}
                    initialViewPreset="angle"
                    style={{
                      borderRadius: '8px',
                      border: '1px solid #d1d5db'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </MazeLoader>
  ),
};