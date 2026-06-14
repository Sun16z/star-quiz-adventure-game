import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  Vector3,
  Color4,
  SceneLoader,
} from '@babylonjs/core';
import '@babylonjs/loaders';
import { splitPublicAssetPath } from './assets';

/**
 * 將一組模型離屏渲染成靜態縮圖（dataURL），用一個暫時引擎依序產生後釋放，
 * 不佔用持久 WebGL context（適合怪物/王圖鑑這類較多項目）。
 * 以 model 路徑為 key，重複路徑只渲染一次。
 */
export async function renderModelThumbnails(
  models: string[],
  onThumb: (model: string, dataUrl: string) => void,
  size = 256,
): Promise<void> {
  const unique = [...new Set(models)];
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const engine = new Engine(canvas, true, { preserveDrawingBuffer: true });

  for (const model of unique) {
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.09, 0.11, 0.18, 1);
    const cam = new ArcRotateCamera('c', Math.PI / 2, Math.PI / 2.5, 4, new Vector3(0, 1, 0), scene);
    const hemi = new HemisphericLight('h', new Vector3(0.3, 1, 0.5), scene);
    hemi.intensity = 1.05;
    const dir = new DirectionalLight('d', new Vector3(-0.4, -1, -0.3), scene);
    dir.intensity = 0.7;

    try {
      const { rootUrl, file } = splitPublicAssetPath(model);
      const res = await SceneLoader.ImportMeshAsync('', rootUrl, file, scene);
      res.animationGroups.forEach((g) => g.stop());
      const root = res.meshes[0];
      const b1 = root.getHierarchyBoundingVectors();
      const dim = Math.max(b1.max.x - b1.min.x, b1.max.y - b1.min.y, b1.max.z - b1.min.z, 0.5);
      root.scaling.scaleInPlace(2 / dim);
      const b = root.getHierarchyBoundingVectors();
      cam.target = new Vector3((b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, (b.min.z + b.max.z) / 2);
      cam.radius = 2.7;
      await scene.whenReadyAsync();
      scene.render();
      scene.render();
      const data = canvas.toDataURL('image/png');
      if (data && data.length > 100) onThumb(model, data);
    } catch {
      /* 略過載入失敗者 */
    }
    scene.dispose();
  }

  engine.dispose();
}
