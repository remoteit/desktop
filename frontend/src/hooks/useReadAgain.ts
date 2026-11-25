import { DependencyList, EffectCallback, useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { accountsDropped, followAccountsDropped } from '../services/accountCaches'

/* A page or a part that READS something for itself — into its own state, not the store — read it as the sign-in that
   served the account then. When another comes to serve it (the person picks one, the one serving it leaves) what the
   store held is dropped and read again (models/accounts readAgain); these reads have to be made again too, or the
   page keeps showing what the sign-in before was shown, under its permissions.

   The page is NOT mounted again for it: whatever the person has typed into it, a dialog they have open, stay. Only
   the reads run again — so every effect or callback that reads is written with useReadEffect or useReadCallback
   instead of useEffect or useCallback (hooks/useReadAgain.test.tsx looks for one that is not). They take the same
   arguments and run at the same times, and once more whenever accounts' data is dropped. */

/** Changes whenever accounts' data is dropped: a dependency for a read. */
export const useReadAgain = (): number => useSyncExternalStore(followAccountsDropped, accountsDropped)

/** useEffect, for an effect that reads. The effect is told when it runs `again` — for accounts' data dropped alone,
 *  nothing it depends on changed: then it reads, and leaves alone what it would clear for something else being shown
 *  (what was read stays up until the new answer, so a form under it is not taken down; a choice made is kept). */
export function useReadEffect(effect: (again: boolean) => ReturnType<EffectCallback>, deps: DependencyList) {
  const dropped = useReadAgain()
  const last = useRef<{ deps: DependencyList; dropped: number }>()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const before = last.current
    last.current = { deps, dropped }
    const again =
      !!before &&
      before.dropped !== dropped &&
      before.deps.length === deps.length &&
      before.deps.every((dep, index) => Object.is(dep, deps[index]) || sameRead(dep, deps[index]))
    return effect(again)
  }, [...deps, dropped])
}

// A read callback is a new function when accounts' data is dropped, so that the effect it is a dependency of runs. It
// is still the same read: each is kept with a mark that changes only when what it depends on does.
const reads = new WeakMap<object, object>()
const sameRead = (a: unknown, b: unknown) =>
  typeof a === 'function' && typeof b === 'function' && !!reads.get(a) && reads.get(a) === reads.get(b)

/** useCallback, for a callback that reads and that an effect runs when it changes. */
export function useReadCallback<T extends (...args: any[]) => any>(callback: T, deps: DependencyList): T {
  const dropped = useReadAgain()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mark = useMemo(() => ({}), deps)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const read = useCallback(callback, [...deps, dropped])
  reads.set(read, mark)
  return read
}
