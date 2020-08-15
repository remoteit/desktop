import { createModel } from '@rematch/core'
import { colors } from '../styling'

const state: ILabel[] = [
  {
    id: 0,
    name: 'none',
    color: colors.white,
  },
  {
    id: 1,
    name: 'gray',
    color: '#b4b4b9',
  },
  {
    id: 2,
    name: 'red',
    color: '#f07d71',
  },
  {
    id: 3,
    name: 'orange',
    color: '#f5bd67',
  },
  {
    id: 4,
    name: 'yellow',
    color: '#fce872',
  },
  {
    id: 5,
    name: 'green',
    color: '#70d461',
  },
  {
    id: 6,
    name: 'blue',
    color: '#61bced',
  },
  {
    id: 7,
    name: 'purple',
    color: '#cb89f8',
  },
]

export default createModel({
  state,
  reducers: {
    // setup as a model for when we can edit labels
  },
})
