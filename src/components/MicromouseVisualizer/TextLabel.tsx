import React from 'react';
import { Text } from '@react-three/drei';
import { CELL_SIZE, FLOOR_THICKNESS } from '../../config/constants';

// TextLabelのProps定義
export interface TextLabelProps {
  cell: { x: number; y: number }; // 対象のセル座標
  text: string;                   // 表示するテキスト
  color?: string;                 // テキストの色
  fontSize?: number;              // フォントサイズ
  height?: number;                // 床からの高さオフセット
  backgroundColor?: string;       // 背景色（指定しない場合は背景なし）
  opacity?: number;               // 透明度
  align?: 'left' | 'center' | 'right'; // テキスト揃え
  rotation?: [number, number, number]; // 回転（x, y, z軸）
}

/**
 * 特定のセルにテキストラベルを配置するコンポーネント
 * セル番号、距離情報、デバッグ情報などの表示に使用可能
 */
const TextLabel: React.FC<TextLabelProps> = ({
  cell,
  text,
  color = '#ffffff',
  fontSize = 0.08,
  height = 0.001,
  backgroundColor,
  opacity = 1,
  align = 'center',
  rotation = [0, 0, 0],
}) => {
  // セル座標から物理座標への変換
  const posX = cell.x * CELL_SIZE + CELL_SIZE / 2;
  const posY = cell.y * CELL_SIZE + CELL_SIZE / 2;
  const posZ = FLOOR_THICKNESS / 2 + height;

  return (
    <group position={[posX, posY, posZ]} rotation={rotation}>
      <Text
        color={color}
        fontSize={fontSize}
        anchorX={align}
        anchorY="middle"
        material-opacity={opacity}
        outlineWidth={backgroundColor ? 0.005 : 0}
        outlineColor={backgroundColor}
        outlineOpacity={backgroundColor ? opacity * 0.8 : 0}
      >
        {text}
      </Text>
    </group>
  );
};

export default TextLabel;