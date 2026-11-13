import { useSyncExternalStore } from 'react'
import { userPicture, userPicturesSubscribe } from '../services/userPictures'

export const useUserPicture = (email?: string) => useSyncExternalStore(userPicturesSubscribe, () => userPicture(email))
