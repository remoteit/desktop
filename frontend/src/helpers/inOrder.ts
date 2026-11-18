/* One-at-a-time queue for writes that send a full snapshot, where an earlier one landing last would
   undo the later. A task queued under one `key()` — the signed-in account — is dropped if the key
   has changed by the time it runs, and a failed task never stops the ones behind it. */
export const inOrder = (key: () => unknown = () => undefined) => {
  let tail: Promise<unknown> = Promise.resolve()
  return <T>(task: () => Promise<T>): Promise<T | undefined> => {
    const queuedFor = key()
    const next = tail.then(() => (key() === queuedFor ? task() : undefined))
    tail = next.catch(() => {})
    return next
  }
}
