/**
 * マイクロマウス迷路ファイル(mazefile)をMazeData型に変換するユーティリティ
 */
import { MazeData } from '../types';

/**
 * マイクロマウス迷路ファイル(mazefile)をフェッチして取得する
 * @param url 迷路ファイルのURL
 * @returns 迷路ファイルの内容を表すテキスト
 */
export const fetchMazeFile = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`迷路ファイルの取得に失敗しました: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error('迷路ファイルの取得中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * マイクロマウス迷路ファイル(mazefile)のテキストからMazeDataオブジェクトを生成する
 * @param mazeText 迷路ファイルの内容
 * @returns MazeDataオブジェクト
 */
export const parseMazeFile = (mazeText: string): MazeData => {
  // 改行で行に分割
  const lines = mazeText.trim().split('\n');
  
  // 迷路のサイズを推定
  // 奇数行（柱と水平壁の行）の数からサイズを計算
  // 例: 16x16の迷路は17の柱行を持つ
  const size = (lines.filter((_, index) => index % 2 === 0).length - 1);
  
  // 壁情報の配列を初期化
  const vwall: boolean[][] = Array(size).fill(null).map(() => Array(size + 1).fill(false));
  const hwall: boolean[][] = Array(size + 1).fill(null).map(() => Array(size).fill(false));
  
  // ゴールとスタートの座標を格納する配列
  const goalCells: { x: number; y: number }[] = [];
  let startCell: { x: number; y: number } | null = null;
  
  // 迷路ファイルを解析
  for (let fileY = 0; fileY < size; fileY++) {
    // Y座標を反転させる（ファイルは上から下に読み込むが、座標系は下から上）
    const y = size - 1 - fileY;
    
    // 水平壁の行（偶数行 - 上から0行目、2行目などの柱と水平壁を含む行）
    const hRowIndex = fileY * 2;
    if (hRowIndex < lines.length) {
      const hRow = lines[hRowIndex];
      for (let x = 0; x < size; x++) {
        // 水平壁を検出
        const wallStartPos = x * 4 + 1; // 各セル間の水平壁の開始位置
        if (wallStartPos + 2 < hRow.length && hRow.substring(wallStartPos, wallStartPos + 3) === '---') {
          // fileYに対応するyではなく、fileY+1に対応する水平壁を設定
          // これは水平壁がセルの上側にあるため
          const wallY = fileY === 0 ? 0 : size - fileY;
          hwall[wallY][x] = true;
        }
      }
    }
    
    // 垂直壁の行（奇数行 - 上から1行目、3行目などの垂直壁とセル内容を含む行）
    const vRowIndex = fileY * 2 + 1;
    if (vRowIndex < lines.length) {
      const vRow = lines[vRowIndex];
      for (let x = 0; x < size + 1; x++) {
        // 垂直壁を検出
        const wallPos = x * 4;
        if (wallPos < vRow.length && vRow[wallPos] === '|') {
          vwall[y][x] = true;
        }
      }
      
      // セル内容（ゴールとスタート）を検出
      for (let x = 0; x < size; x++) {
        const cellContentPos = x * 4 + 2; // セル内容の中央位置
        if (cellContentPos < vRow.length) {
          if (vRow[cellContentPos] === 'G') {
            goalCells.push({ x, y });
          } else if (vRow[cellContentPos] === 'S') {
            startCell = { x, y };
          }
        }
      }
    }
  }
  
  // 最下行の水平壁を設定（最後の行）
  if (lines.length > 0) {
    const lastHRowIndex = size * 2;
    if (lastHRowIndex < lines.length) {
      const lastHRow = lines[lastHRowIndex];
      for (let x = 0; x < size; x++) {
        const wallStartPos = x * 4 + 1;
        if (wallStartPos + 2 < lastHRow.length && lastHRow.substring(wallStartPos, wallStartPos + 3) === '---') {
          hwall[size][x] = true;
        }
      }
    }
  }
  
  // 外壁を設定（すべての迷路は閉じられた領域なので外周には壁がある）
  for (let y = 0; y < size; y++) {
    vwall[y][0] = true; // 左端
    vwall[y][size] = true; // 右端
  }
  for (let x = 0; x < size; x++) {
    hwall[0][x] = true; // 上端
    hwall[size][x] = true; // 下端
  }
  
  // スタートが見つからない場合、デフォルトで左下(0,0)に設定
  if (!startCell) {
    startCell = { x: 0, y: 0 };
  }
  
  // ゴールが見つからない場合、迷路サイズに応じてデフォルトのゴールエリアを設定
  if (goalCells.length === 0) {
    // 16x16の場合、中央付近の4セルをゴールに
    const goalCenter = Math.floor(size / 2) - (size === 32 ? 0 : 1);
    goalCells.push(
      { x: goalCenter, y: goalCenter },
      { x: goalCenter + 1, y: goalCenter },
      { x: goalCenter, y: goalCenter + 1 },
      { x: goalCenter + 1, y: goalCenter + 1 }
    );
  }
  
  return {
    size,
    walls: { vwall, hwall },
    start: startCell,
    goal: goalCells
  };
};

/**
 * URLからマイクロマウス迷路ファイル(mazefile)を読み込み、MazeDataオブジェクトに変換する
 * @param url 迷路ファイルのURL
 * @returns MazeDataオブジェクト
 */
export const loadMazeFromUrl = async (url: string): Promise<MazeData> => {
  const mazeText = await fetchMazeFile(url);
  return parseMazeFile(mazeText);
};