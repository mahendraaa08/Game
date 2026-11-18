export interface Poolable {
  active: boolean;
  setActive(value: boolean): this;
  setVisible(value: boolean): this;
}

export class ObjectPool<T extends Poolable> {
  private items: T[] = [];
  private factory: () => T;
  private maxSize: number;

  constructor(factory: () => T, initialSize = 0, maxSize = 250) {
    this.factory = factory;
    this.maxSize = maxSize;
    for (let i = 0; i < initialSize; i++) {
      const item = this.factory();
      item.setActive(false).setVisible(false);
      this.items.push(item);
    }
  }

  acquire(): T | null {
    for (let i = 0; i < this.items.length; i++) {
      if (!this.items[i].active) {
        return this.items[i];
      }
    }
    if (this.items.length < this.maxSize) {
      const created = this.factory();
      this.items.push(created);
      return created;
    }
    return null;
  }

  hasActive(): boolean {
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].active) return true;
    }
    return false;
  }

  fillActive(out: T[]): T[] {
    out.length = 0;
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].active) {
        out.push(this.items[i]);
      }
    }
    return out;
  }

  getActiveItems(): T[] {
    return this.items.filter((item) => item.active);
  }

  forEachActive(cb: (item: T) => void): void {
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].active) {
        cb(this.items[i]);
      }
    }
  }

  releaseAll(): void {
    for (let i = 0; i < this.items.length; i++) {
      this.items[i].setActive(false).setVisible(false);
    }
  }
}
