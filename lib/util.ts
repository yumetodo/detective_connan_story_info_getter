export function hasProperty<K extends string>(x: unknown, ...name: K[]): x is { [M in K]: unknown } {
  return x instanceof Object && name.every(prop => prop in x);
}
export function isArray(a: unknown): a is unknown[] {
  return Array.isArray(a);
}
