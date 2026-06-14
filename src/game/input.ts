/** 跨平台輸入：鍵盤（WASD／方向鍵）＋ 觸控虛擬搖桿，合成單一移動方向 */
export class Input {
  private keys = new Set<string>();
  private active = true;
  /** 觸控搖桿方向（已正規化，-1~1） */
  private joystick = { x: 0, z: 0 };

  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.active) return;
    const key = this.normalizeKey(e);
    if (!key) return;
    this.keys.add(key);
    e.preventDefault();
  };
  private onKeyUp = (e: KeyboardEvent) => {
    if (!this.active) return;
    const key = this.normalizeKey(e);
    if (!key) return;
    this.keys.delete(key);
    e.preventDefault();
  };

  attach() {
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp, { passive: false });
  }

  detach() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.clear();
  }

  setActive(active: boolean) {
    this.active = active;
    if (!active) this.clear();
  }

  clear() {
    this.keys.clear();
    this.joystick.x = 0;
    this.joystick.z = 0;
  }

  /** 由 Vue 搖桿元件呼叫 */
  setJoystick(x: number, z: number) {
    if (!this.active) return;
    this.joystick.x = x;
    this.joystick.z = z;
  }

  /** 取得正規化後的移動方向（世界 x/z） */
  getDirection(): { x: number; z: number } {
    let x = 0;
    let z = 0;
    if (this.keys.has('w') || this.keys.has('arrowup')) z += 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) z -= 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;

    /** 鍵盤無輸入時改用搖桿 */
    if (x === 0 && z === 0) {
      x = this.joystick.x;
      z = this.joystick.z;
    }

    const len = Math.hypot(x, z);
    if (len > 1) {
      x /= len;
      z /= len;
    }
    return { x, z };
  }

  private normalizeKey(e: KeyboardEvent): string {
    const byCode: Record<string, string> = {
      KeyW: 'w',
      KeyA: 'a',
      KeyS: 's',
      KeyD: 'd',
      ArrowUp: 'arrowup',
      ArrowDown: 'arrowdown',
      ArrowLeft: 'arrowleft',
      ArrowRight: 'arrowright',
    };
    const key = byCode[e.code] ?? e.key.toLowerCase();
    if (key === 'w' || key === 'a' || key === 's' || key === 'd' || key.startsWith('arrow')) return key;
    return '';
  }
}
