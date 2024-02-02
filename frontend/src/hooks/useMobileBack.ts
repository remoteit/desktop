import { REGEX_FIRST_PATH } from '../constants'
import { useHistory, useLocation } from 'react-router-dom'
import { State } from '../store'
import { useSelector } from 'react-redux'

const useMobileBack = () => {
  const history = useHistory()
  const location = useLocation()
  const customHistory = useSelector((state: State) => state.ui.mobileNavigation)

  const goUp = () => {
    const newHistory = [...customHistory]

    if (newHistory.length <= 1) {
      // If no previous history just go to root of the pathname
      newHistory[0] = location.pathname.match(REGEX_FIRST_PATH)?.[0] || '/'
    } else {
      // Remove the last entry (current path)
      newHistory.pop()
    }

    // Get the last entry from the updated history array
    const upPath = newHistory[newHistory.length - 1]

    console.log('MOBILE NAVIGATION goUp', upPath)

    // Navigate to the previous path
    history.push(upPath)
  }

  return goUp
}

export default useMobileBack
