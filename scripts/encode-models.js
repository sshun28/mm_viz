const fs = require('fs');
const path = require('path');

// 3Dモデルファイルをbase64エンコードしてJavaScriptファイルに出力
const modelsDir = path.join(__dirname, '../3d_models');
const outputDir = path.join(__dirname, '../src/assets');

// すべてのモデルをbase64エンコード
const modelsToEncode = ['wall.fbx', 'pillar.fbx', 'micromouse.fbx'];

let output = `// Auto-generated file - do not edit manually\n// Base64 encoded 3D models\n\n`;

modelsToEncode.forEach(filename => {
  const filepath = path.join(modelsDir, filename);
  if (fs.existsSync(filepath)) {
    const data = fs.readFileSync(filepath);
    const base64 = data.toString('base64');
    const modelName = filename.replace('.fbx', '');
    
    output += `export const ${modelName.toUpperCase()}_BASE64 = 'data:application/octet-stream;base64,${base64}';\n\n`;
    
    console.log(`Encoded ${filename}: ${(data.length / 1024).toFixed(1)}KB -> ${(base64.length / 1024).toFixed(1)}KB`);
  } else {
    console.warn(`File not found: ${filepath}`);
  }
});

// ファイルに出力
const outputPath = path.join(outputDir, 'embeddedModels.ts');
fs.writeFileSync(outputPath, output);

console.log(`\nGenerated: ${outputPath}`);