import { useSyncExternalStore } from 'react'
import { userPicture, userPicturesSubscribe } from '../services/userPictures'

/** The picture graphql answered for this person, re-read whenever a response brings a new one. */
export const useUserPicture = (email?: string) => useSyncExternalStore(userPicturesSubscribe, () => userPicture(email))
