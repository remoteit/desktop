/** What something asked came to, waited on no longer than `ms`: undefined where it failed, or did not answer in time. */
export const within = <T>(asked: Promise<T>, ms: number): Promise<T | undefined> =>
  new Promise(resolve => {
    const timer = setTimeout(() => resolve(undefined), ms)
    asked.then(resolve, () => resolve(undefined)).finally(() => clearTimeout(timer))
  })
