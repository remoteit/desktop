import { useEffect } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'

export function useViewAsUser() {
  const location = useLocation()
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()

  useEffect(() => {
    // First, try to restore from sessionStorage (survives refresh)
    const savedViewAs = window.sessionStorage.getItem('viewAsUser')
    if (savedViewAs) {
      try {
        const viewAsUser = JSON.parse(savedViewAs)
        dispatch.ui.set({ viewAsUser })
        console.log('Restored viewAs from sessionStorage:', viewAsUser)
      } catch (e) {
        console.error('Failed to parse viewAsUser from sessionStorage:', e)
      }
    }
    
    // Then check URL parameter (for initial open)
    const params = new URLSearchParams(location.search)
    const viewAsParam = params.get('viewAs')
    
    if (viewAsParam) {
      const [userId, email] = viewAsParam.split(',')
      if (userId && email) {
        const viewAsUser = { id: userId, email: decodeURIComponent(email) }
        dispatch.ui.set({ viewAsUser })
        // Save to sessionStorage for persistence across refreshes
        window.sessionStorage.setItem('viewAsUser', JSON.stringify(viewAsUser))
        console.log('Set viewAs from URL:', viewAsUser)
        
        // Remove the parameter from URL
        params.delete('viewAs')
        const newSearch = params.toString()
        history.replace({
          pathname: location.pathname,
          search: newSearch ? `?${newSearch}` : '',
        })
      }
    }
  }, [location.search, dispatch, history, location.pathname])
}
