// 3Dモデルファイルのパスを管理
// 使用側のプロジェクトで適切にコピーして使用する必要があります

export const MODEL_PATHS = {
  wall: '/3d_models/wall.fbx',
  pillar: '/3d_models/pillar.fbx',
  micromouse: '/3d_models/micromouse.fbx',
} as const;

// パッケージ利用者向けの設定関数
let modelBasePath = '/3d_models';

export const setModelBasePath = (basePath: string) => {
  modelBasePath = basePath;
};

export const getModelPath = (modelName: keyof typeof MODEL_PATHS): string => {
  const fileName = MODEL_PATHS[modelName].split('/').pop()!;
  return `${modelBasePath}/${fileName}`;
};