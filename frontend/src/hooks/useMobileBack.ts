import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { ApplicationState } from '../store'

const useMobileBack = () => {
  const history = useHistory()
  const dispatch = useDispatch()
  const customHistory = useSelector((state: ApplicationState) => state.ui.mobileNavigation)

  const goUp = () => {
    console.log('GO UP', customHistory)
    if (customHistory.length < 2) {
      // Can't go up if there's no previous history
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
