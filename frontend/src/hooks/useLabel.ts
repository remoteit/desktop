import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'

export const useLabel = () => {
  const { labels } = useSelector((state: ApplicationState) => state)
  return id => labels.find(l => l.id === id)?.color || labels[1].color
}
