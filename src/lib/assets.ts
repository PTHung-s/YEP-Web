export function appAsset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}

export function yepAsset(filename: string): string {
  return appAsset(`assets/yep/${filename}`);
}
