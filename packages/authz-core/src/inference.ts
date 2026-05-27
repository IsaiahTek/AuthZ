export type PermissionStrings<T extends Record<string, string[]>> = {
  [K in keyof T]: `${K & string}.${T[K][number] & string}` | `${K & string}.*`;
}[keyof T] | '*';

export function defineResources<T extends Record<string, string[]>>(resources: T): T {
  return resources;
}
