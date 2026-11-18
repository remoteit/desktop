export default function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** The promise, or null once `ms` has passed without it — a bounded wait on a best-effort call. */
export const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T | null> =>
  Promise.race([promise, sleep(ms).then(() => null)])
