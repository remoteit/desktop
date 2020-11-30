import { createModel } from '@rematch/core'
import { colors } from '../styling'
import { RootModel } from './rootModel'

const state: ILabel[] = [
  {
    id: 0,
    name: 'none',
    color: colors.white,
  },
  {
    id: 1,
    name: 'gray',
    color: colors.grayDark,
  },
  {
    id: 2,
    name: 'red',
    color: '#e65b4c',
  },
  {
    id: 3,
    name: 'orange',
    color: '#ed9332',
  },
  {
    id: 4,
    name: 'yellow',
    color: '#f5d33d',
  },
  {
    id: 5,
    name: 'green',
    color: '#61c951',
  },
  {
    id: 6,
    name: 'blue',
    color: '#61bced',
  },
  {
    id: 7,
    name: 'purple',
    color: '#8f4eba',
  },
]

export default createModel<RootModel>()({
  state,
  reducers: {
    // setup as a model for when we can edit labels
  },
})
