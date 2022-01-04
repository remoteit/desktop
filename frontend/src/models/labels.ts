import { createModel } from '@rematch/core'
import { RootModel } from './rootModel'
import { toLookup } from '../helpers/utilHelper'

const state: ILabel[] = [
  {
    id: 0,
    key: 'NONE',
    name: 'none',
    color: 'none',
    hidden: true,
  },
  {
    id: 1,
    key: 'GRAY',
    name: 'gray',
    color: '#797c86',
  },
  {
    id: 2,
    key: 'RED',
    name: 'red',
    color: '#e65b4c',
  },
  {
    id: 3,
    key: 'ORANGE',
    name: 'orange',
    color: '#ed9332',
  },
  {
    id: 4,
    key: 'YELLOW',
    name: 'yellow',
    color: '#f5d33d',
  },
  {
    id: 5,
    key: 'GREEN',
    name: 'green',
    color: '#61c951',
  },
  {
    id: 6,
    key: 'BLUE',
    name: 'blue',
    color: '#61bced',
  },
  {
    id: 7,
    key: 'PURPLE',
    name: 'purple',
    color: '#8f4eba',
  },
]

export const labelLookup = toLookup<ILabel>(state, 'id')

export default createModel<RootModel>()({
  state,
  reducers: {
    // setup as a model for when we can edit labels
  },
})
