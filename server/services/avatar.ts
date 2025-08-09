const overrides = new Map<string, string>();

export const AvatarOverride = {
  get(userId: string): string | undefined {
    return overrides.get(userId);
  },
  set(userId: string, url: string) {
    overrides.set(userId, url);
  },
  clear(userId: string) {
    overrides.delete(userId);
  },
};

