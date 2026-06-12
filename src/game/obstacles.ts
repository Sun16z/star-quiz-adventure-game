/** 場上實心障礙物（油桶、貨櫃、水塔等），阻擋玩家與怪物。 */
export interface Obstacle {
  x: number;
  z: number;
  radius: number;
}

/**
 * 將圓形實體推出所有重疊的障礙物，結果寫入 out。
 * entityRadius 為實體自身半徑；逐一處理每個障礙物的最小分離距離。
 */
export function resolveObstacles(
  obstacles: Obstacle[],
  x: number,
  z: number,
  entityRadius: number,
  out: { x: number; z: number },
): void {
  out.x = x;
  out.z = z;
  for (let k = 0; k < obstacles.length; k++) {
    const o = obstacles[k];
    const dx = out.x - o.x;
    const dz = out.z - o.z;
    const min = o.radius + entityRadius;
    const d2 = dx * dx + dz * dz;
    if (d2 >= min * min) continue;
    if (d2 > 1e-6) {
      const d = Math.sqrt(d2);
      const push = (min - d) / d;
      out.x += dx * push;
      out.z += dz * push;
    } else {
      /** 圓心幾乎重合：任選一方向推出 */
      out.x += min;
    }
  }
}
