const store = new Map<string, { localUri: string }>();

export const photoStore = {
  register(id: string, localUri: string): void {
    store.set(id, { localUri });
  },

  get(id: string): string | undefined {
    return store.get(id)?.localUri;
  },

  remove(id: string): void {
    store.delete(id);
  },

  clear(): void {
    store.clear();
  },
};
