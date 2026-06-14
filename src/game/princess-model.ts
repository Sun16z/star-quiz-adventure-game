import {
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
} from '@babylonjs/core';

export type PrincessStyle = 'star' | 'heart';

interface PrincessPalette {
  dress: Color3;
  trim: Color3;
  hair: Color3;
  skin: Color3;
  accent: Color3;
  glow: Color3;
}

const PALETTES: Record<PrincessStyle, PrincessPalette> = {
  star: {
    dress: new Color3(0.45, 0.68, 1),
    trim: new Color3(0.95, 0.86, 1),
    hair: new Color3(0.96, 0.82, 0.38),
    skin: new Color3(1, 0.78, 0.62),
    accent: new Color3(1, 0.92, 0.35),
    glow: new Color3(0.58, 0.9, 1),
  },
  heart: {
    dress: new Color3(1, 0.43, 0.68),
    trim: new Color3(1, 0.9, 0.96),
    hair: new Color3(0.98, 0.72, 0.28),
    skin: new Color3(1, 0.78, 0.62),
    accent: new Color3(1, 0.72, 0.18),
    glow: new Color3(1, 0.55, 0.86),
  },
};

function material(scene: Scene, name: string, color: Color3, emissive = 0): StandardMaterial {
  const mat = new StandardMaterial(name, scene);
  mat.diffuseColor = color;
  mat.emissiveColor = color.scale(emissive);
  mat.specularColor = Color3.Black();
  return mat;
}

function attach(mesh: Mesh, parent: TransformNode, mat: StandardMaterial): Mesh {
  mesh.parent = parent;
  mesh.material = mat;
  mesh.isPickable = false;
  return mesh;
}

function makeStar(scene: Scene, parent: TransformNode, mat: StandardMaterial, y: number) {
  const core = attach(MeshBuilder.CreateSphere('princess-star-core', { diameter: 0.2, segments: 12 }, scene), parent, mat);
  core.position.set(0, y, 0);
  for (let i = 0; i < 5; i++) {
    const ray = attach(MeshBuilder.CreateCylinder('princess-star-ray', { diameterTop: 0, diameterBottom: 0.12, height: 0.32, tessellation: 8 }, scene), parent, mat);
    ray.position.set(Math.cos((i / 5) * Math.PI * 2) * 0.14, y + Math.sin((i / 5) * Math.PI * 2) * 0.14, 0);
    ray.rotation.z = (i / 5) * Math.PI * 2 - Math.PI / 2;
  }
}

export function createPrincessModel(scene: Scene, style: PrincessStyle = 'star'): TransformNode {
  const palette = PALETTES[style];
  const root = new TransformNode(`princess-${style}`, scene);

  const dressMat = material(scene, `princess-${style}-dress`, palette.dress, 0.12);
  const trimMat = material(scene, `princess-${style}-trim`, palette.trim, 0.08);
  const hairMat = material(scene, `princess-${style}-hair`, palette.hair, 0.04);
  const skinMat = material(scene, `princess-${style}-skin`, palette.skin);
  const accentMat = material(scene, `princess-${style}-accent`, palette.accent, 0.25);
  const glowMat = material(scene, `princess-${style}-glow`, palette.glow, 0.45);
  const faceMat = material(scene, `princess-${style}-face`, new Color3(0.12, 0.08, 0.12));
  const blushMat = material(scene, `princess-${style}-blush`, new Color3(1, 0.42, 0.58), 0.08);

  const skirt = attach(
    MeshBuilder.CreateCylinder('princess-skirt', { height: 1.12, diameterTop: 0.72, diameterBottom: 1.5, tessellation: 32 }, scene),
    root,
    dressMat,
  );
  skirt.position.y = 0.58;

  const hem = attach(MeshBuilder.CreateTorus('princess-hem', { diameter: 1.48, thickness: 0.08, tessellation: 48 }, scene), root, trimMat);
  hem.position.y = 0.04;
  hem.rotation.x = Math.PI / 2;

  const torso = attach(
    MeshBuilder.CreateCylinder('princess-torso', { height: 0.72, diameterTop: 0.5, diameterBottom: 0.72, tessellation: 24 }, scene),
    root,
    dressMat,
  );
  torso.position.y = 1.32;

  const collar = attach(MeshBuilder.CreateTorus('princess-collar', { diameter: 0.62, thickness: 0.05, tessellation: 32 }, scene), root, trimMat);
  collar.position.y = 1.7;
  collar.rotation.x = Math.PI / 2;

  const head = attach(MeshBuilder.CreateSphere('princess-head', { diameter: 0.55, segments: 24 }, scene), root, skinMat);
  head.position.y = 2.08;

  const hairBack = attach(MeshBuilder.CreateSphere('princess-hair-back', { diameter: 0.72, segments: 24 }, scene), root, hairMat);
  hairBack.position.set(0, 2.04, 0.14);
  hairBack.scaling.set(0.9, 1.1, 0.55);

  const bang = attach(MeshBuilder.CreateSphere('princess-bang', { diameter: 0.5, segments: 16 }, scene), root, hairMat);
  bang.position.set(0, 2.22, -0.18);
  bang.scaling.set(1.05, 0.42, 0.32);

  const leftEye = attach(MeshBuilder.CreateSphere('princess-left-eye', { diameter: 0.055, segments: 8 }, scene), root, faceMat);
  leftEye.position.set(-0.12, 2.1, -0.27);
  const rightEye = attach(MeshBuilder.CreateSphere('princess-right-eye', { diameter: 0.055, segments: 8 }, scene), root, faceMat);
  rightEye.position.set(0.12, 2.1, -0.27);
  const leftBlush = attach(MeshBuilder.CreateSphere('princess-left-blush', { diameter: 0.07, segments: 8 }, scene), root, blushMat);
  leftBlush.position.set(-0.2, 2.02, -0.26);
  leftBlush.scaling.set(1.35, 0.55, 0.35);
  const rightBlush = attach(MeshBuilder.CreateSphere('princess-right-blush', { diameter: 0.07, segments: 8 }, scene), root, blushMat);
  rightBlush.position.set(0.2, 2.02, -0.26);
  rightBlush.scaling.set(1.35, 0.55, 0.35);

  const crownBase = attach(MeshBuilder.CreateCylinder('princess-crown-base', { height: 0.14, diameter: 0.5, tessellation: 24 }, scene), root, accentMat);
  crownBase.position.y = 2.45;
  for (let i = 0; i < 3; i++) {
    const spike = attach(MeshBuilder.CreateCylinder('princess-crown-spike', { height: 0.34, diameterTop: 0, diameterBottom: 0.16, tessellation: 8 }, scene), root, accentMat);
    spike.position.set((i - 1) * 0.18, 2.66, -0.03);
  }

  const leftArm = attach(MeshBuilder.CreateCylinder('princess-left-arm', { height: 0.72, diameter: 0.12, tessellation: 12 }, scene), root, skinMat);
  leftArm.position.set(-0.5, 1.42, -0.02);
  leftArm.rotation.z = -0.45;
  const rightArm = attach(MeshBuilder.CreateCylinder('princess-right-arm', { height: 0.72, diameter: 0.12, tessellation: 12 }, scene), root, skinMat);
  rightArm.position.set(0.55, 1.44, -0.02);
  rightArm.rotation.z = 0.72;

  const wand = attach(MeshBuilder.CreateCylinder('princess-wand', { height: 0.82, diameter: 0.04, tessellation: 8 }, scene), root, accentMat);
  wand.position.set(0.82, 1.64, -0.06);
  wand.rotation.z = -0.34;
  makeStar(scene, root, glowMat, 2.08);
  root.getChildren().forEach((child) => {
    if (child instanceof Mesh && child.name.startsWith('princess-star')) {
      child.position.x += 0.96;
      child.position.z -= 0.08;
    }
  });

  const gem = attach(MeshBuilder.CreateSphere('princess-gem', { diameter: 0.14, segments: 12 }, scene), root, glowMat);
  gem.position.set(0, 1.48, -0.34);

  root.rotation.y = Math.PI;
  return root;
}
