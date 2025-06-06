// 3Dモデルファイルのパスを管理
// Base64埋め込みデータまたはファイルパスを自動選択

export const MODEL_PATHS = {
  wall: '/3d_models/wall.fbx',
  pillar: '/3d_models/pillar.fbx',
  micromouse: '/3d_models/micromouse.fbx',
} as const;

// 設定
let modelBasePath = '/3d_models';
let useEmbeddedModels = true; // デフォルトで埋め込みモデルを使用

export const setModelBasePath = (basePath: string) => {
  modelBasePath = basePath;
};

export const setUseEmbeddedModels = (enabled: boolean) => {
  useEmbeddedModels = enabled;
};

export const getUseEmbeddedModels = (): boolean => {
  return useEmbeddedModels;
};

export const getModelPath = (modelName: keyof typeof MODEL_PATHS): string => {
  // 埋め込みモデルが有効な場合はbase64を返す
  if (useEmbeddedModels) {
    try {
      // 埋め込みデータの取得を試行
      if (modelName === 'wall') {
        const { WALL_BASE64 } = require('./embeddedModels');
        if (WALL_BASE64) return WALL_BASE64;
      }
      if (modelName === 'pillar') {
        const { PILLAR_BASE64 } = require('./embeddedModels');
        if (PILLAR_BASE64) return PILLAR_BASE64;
      }
      if (modelName === 'micromouse') {
        const { MICROMOUSE_BASE64 } = require('./embeddedModels');
        if (MICROMOUSE_BASE64) return MICROMOUSE_BASE64;
      }
    } catch (error) {
      console.warn(`Failed to load embedded model for ${modelName}, falling back to file path`);
    }
  }
  
  // フォールバック: 通常のファイルパス
  const fileName = MODEL_PATHS[modelName].split('/').pop()!;
  return `${modelBasePath}/${fileName}`;
};