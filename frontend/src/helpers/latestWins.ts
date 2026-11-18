/* A latest-wins ticket for one kind of request: `take()` before the call, and apply the answer
   only if the ticket it returns still says it is the newest. `invalidate()` retires everything in
   flight without starting anything (a sign-out, a switch of target). */
export const latestWins = () => {
  let current = 0
  return {
    take: () => {
      const ticket = ++current
      return () => ticket === current
    },
    invalidate: () => void ++current,
  }
}
