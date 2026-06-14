import { Scene } from '@babylonjs/core';

/**
 * 夢境主題不在地面留下貼片痕跡。
 * 保留同一個類別介面，讓戰鬥主迴圈不需要知道目前主題是否有地面裝飾。
 */
export class BloodDecals {
  constructor(_scene: Scene) {}

  spawn(_x: number, _z: number, _y = 0.03) {}

  reset() {}
}
