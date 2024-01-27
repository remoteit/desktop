import { useSelector } from 'react-redux'
import { State } from '../store'

export const useLabel = () => {
  const labels = useSelector((state: State) => state.labels)
  return id => labels.find(l => l.id === id)?.color || labels[1].color
}
