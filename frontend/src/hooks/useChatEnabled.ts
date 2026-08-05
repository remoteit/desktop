import { useSelector } from 'react-redux'
import { State } from '../store'
import { MODE } from '../constants'

/* Mycal is always on in local dev builds; in deployed builds it soft-launches
   behind the hidden Test UI (shift+option on the avatar menu → Test UI). */
export const useChatEnabled = (): boolean => {
  const testUI = useSelector((state: State) => state.ui.testUI)
  return MODE === 'development' || !!testUI
}
