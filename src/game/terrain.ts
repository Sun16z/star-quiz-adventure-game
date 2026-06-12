import {
  Scene,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  DynamicTexture,
  Texture,
  VertexBuffer,
  VertexData,
} from '@babylonjs/core';
import { CONFIG } from './config';

/**
 * 地形高度（解析函式，給所有單位貼地用）。目前為全平面。
 * 若日後想要起伏，改這裡回傳高度即可（其餘貼地邏輯已接好）。
 */
export function terrainHeight(_x: number, _z: number): number {
  return 0;
}

/** 末日柏油路面材質：高解析、多種隨機元素，降低平鋪重複感 */
function asphaltMaterial(scene: Scene): StandardMaterial {
  const px = 1024;
  const tex = new DynamicTexture('ground-tex', px, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;

  /** 底色 */
  ctx.fillStyle = '#262d39';
  ctx.fillRect(0, 0, px, px);

  /** 深淺柏油補丁（修補痕，打破單一色塊） */
  for (let k = 0; k < 14; k++) {
    const w = 80 + Math.random() * 240;
    const h = 80 + Math.random() * 240;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.08)';
    ctx.fillRect(Math.random() * px, Math.random() * px, w, h);
  }

  /** 顆粒雜訊 */
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.07)';
    ctx.fillRect(Math.random() * px, Math.random() * px, 2, 2);
  }

  /** 接縫 */
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 8;
  ctx.strokeRect(0, 0, px, px);

  /** 裂縫（鋸齒分支） */
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  for (let k = 0; k < 10; k++) {
    let x = Math.random() * px;
    let y = Math.random() * px;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 7; s++) {
      x += (Math.random() - 0.5) * 160;
      y += (Math.random() - 0.5) * 160;
      ctx.lineTo(x, y);
    }
    ctx.lineWidth = 1 + Math.random() * 2.5;
    ctx.stroke();
  }

  /** 人孔蓋 */
  for (let k = 0; k < 3; k++) {
    const mx = Math.random() * px;
    const my = Math.random() * px;
    const r = 26 + Math.random() * 14;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.arc(mx, my, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(160,170,190,0.18)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(mx, my, r - 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  /** 水漬／油漬（暗色不規則） */
  for (let k = 0; k < 5; k++) {
    const bx = Math.random() * px;
    const by = Math.random() * px;
    const r = 30 + Math.random() * 60;
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, r);
    g.addColorStop(0, 'rgba(10,14,22,0.5)');
    g.addColorStop(1, 'rgba(10,14,22,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
  }

  /** 血漬 */
  for (let k = 0; k < 4; k++) {
    const bx = Math.random() * px;
    const by = Math.random() * px;
    const r = 24 + Math.random() * 55;
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, r);
    g.addColorStop(0, 'rgba(85,12,12,0.6)');
    g.addColorStop(1, 'rgba(85,12,12,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
  }

  /** 褪色路面標線（白/黃虛線，隨機角度） */
  for (let k = 0; k < 8; k++) {
    ctx.save();
    ctx.translate(Math.random() * px, Math.random() * px);
    ctx.rotate(Math.random() * Math.PI);
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(200,180,45,0.18)' : 'rgba(210,210,210,0.16)';
    for (let d = 0; d < 3; d++) ctx.fillRect(d * 34, 0, 22, 5);
    ctx.restore();
  }

  tex.update();
  tex.wrapU = Texture.WRAP_ADDRESSMODE;
  tex.wrapV = Texture.WRAP_ADDRESSMODE;
  tex.uScale = 6;
  tex.vScale = 6;

  const material = new StandardMaterial('ground-material', scene);
  material.diffuseTexture = tex;
  material.specularColor = Color3.Black();
  return material;
}

/**
 * 建立起伏地形：細分地面網格，依 terrainHeight 位移頂點並重算法線。
 * 回傳 mesh 與高度查詢函式（兩者用同一函式，保證視覺與貼地一致）。
 */
export function createTerrain(scene: Scene): { mesh: Mesh; heightAt: (x: number, z: number) => number } {
  const size = CONFIG.arenaHalf * 2.4;
  const ground = MeshBuilder.CreateGround(
    'ground',
    { width: size, height: size, subdivisions: 120, updatable: true },
    scene,
  );

  const positions = ground.getVerticesData(VertexBuffer.PositionKind);
  if (positions) {
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] = terrainHeight(positions[i], positions[i + 2]);
    }
    ground.updateVerticesData(VertexBuffer.PositionKind, positions);
    const indices = ground.getIndices();
    if (indices) {
      const normals: number[] = [];
      VertexData.ComputeNormals(positions, indices, normals);
      ground.updateVerticesData(VertexBuffer.NormalKind, normals);
    }
  }

  ground.material = asphaltMaterial(scene);
  ground.isPickable = false;
  return { mesh: ground, heightAt: terrainHeight };
}
