import { useState } from 'react'
import { useSelector } from 'react-redux'
import { State } from '../store'
import { fetchFileStorage, FileStorage } from '../services/fileStorage'
import { useReadEffect } from './useReadAgain'
import { sharedRead } from '../services/accountCaches'

// One read per account for every part of a page that asks in the same moment (the bar and the upload form).
const read = sharedRead(fetchFileStorage)

/* An account's file storage (services/fileStorage): undefined while read; null where there is none to show — an API
   without it, one the person may not script, or direct uploads off (its numbers are not kept then). Read again
   whenever the account's files are, so an upload or a delete shows in it. */
export function useFileStorage(accountId?: string): FileStorage | null | undefined {
  const files = useSelector((state: State) => (accountId ? state.files.all[accountId] : undefined))
  const [storage, setStorage] = useState<FileStorage | null>()

  useReadEffect(() => {
    if (!accountId) return setStorage(null)
    let current = true
    read(accountId).then(result => {
      if (!current) return
      setStorage(result && typeof result === 'object' && result.directUpload ? result : null)
    })
    return () => {
      current = false
    }
  }, [accountId, files])

  return storage
}
