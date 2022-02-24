import { createModel } from '@rematch/core'
import { RootModel } from './rootModel'
import { toLookup } from '../helpers/utilHelper'

const state: ILabel[] = [
  {
    id: 0,
    name: 'none',
    color: 'None',
    hidden: true,
  },
  {
    id: 1,
    name: 'Gray',
    color: '#797c86',
  },
  {
    id: 2,
    name: 'Red',
    color: '#e65b4c',
  },
  {
    id: 3,
    name: 'Orange',
    color: '#ed9332',
  },
  {
    id: 4,
    name: 'Yellow',
    color: '#f5d33d',
  },
  {
    id: 5,
    name: 'Green',
    color: '#61c951',
  },
  {
    id: 6,
    name: 'Blue',
    color: '#61bced',
  },
  {
    id: 7,
    name: 'Purple',
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
