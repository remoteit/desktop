import { REGEX_FIRST_PATH } from '../constants'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory, useLocation } from 'react-router-dom'
import { ApplicationState } from '../store'

const useMobileBack = () => {
  const history = useHistory()
  const location = useLocation()
  const dispatch = useDispatch()
  const customHistory = useSelector((state: ApplicationState) => state.ui.mobileNavigation)

  const goUp = () => {
    if (!customHistory.length || (customHistory.length === 1 && customHistory[0] === history.location.pathname)) {
      // If no previous history just go to root of the pathname
      dispatch.ui.set({ mobileNavigation: location.pathname.match(REGEX_FIRST_PATH)?.[0] || '/' })
      return
    }

    // Remove the last entry (current path)
    const newHistory = [...customHistory]
    newHistory.pop()

    // Get the last entry from the updated history array
    const upPath = newHistory[newHistory.length - 1]

    // Update Redux state
    dispatch.ui.set({ mobileNavigation: newHistory })

    // Navigate to the previous path
    history.push(upPath)
  }

  return goUp
}

export default useMobileBack
