export function toLookup<T>(array: T[], key: string): ILookup<T> {
  return array.reduce((obj, item) => ({ ...obj, [item[key]]: item }), {})
}
