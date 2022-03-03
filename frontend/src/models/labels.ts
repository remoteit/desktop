import { ApplicationState } from '../store'
import { createModel } from '@rematch/core'
import { RootModel } from './rootModel'
import { toLookup } from '../helpers/utilHelper'

const state: ILabel[] = [
  {
    id: 0,
    name: 'none',
    color: 'inherit',
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
    color: '#E65B4C',
  },
  {
    id: 3,
    name: 'Orange',
    color: '#EF922E',
  },
  {
    id: 4,
    name: 'Yellow',
    color: '#F5CC17',
  },
  {
    id: 5,
    name: 'Lime',
    color: '#BBD40F',
  },
  {
    id: 6,
    name: 'Green',
    color: '#61C951',
  },
  {
    id: 7,
    name: 'Teal',
    color: '#31C49E',
  },
  {
    id: 8,
    name: 'Sky',
    color: '#4AB8F4',
  },
  {
    id: 9,
    name: 'Blue',
    color: '#6193FE',
  },
  {
    id: 10,
    name: 'Violet',
    color: '#6F54CC',
  },
  {
    id: 11,
    name: 'Purple',
    color: '#8F4EBA',
  },
  {
    id: 12,
    name: 'Berry',
    color: '#C236AB',
  },
  {
    id: 13,
    name: 'Pink',
    color: '#E13F88',
  },
]

export const labelLookup = toLookup<ILabel>(state, 'id')

export default createModel<RootModel>()({
  state,
  reducers: {
    // setup as a model for when we can edit labels
  },
})

export function getNextLabel(state: ApplicationState) {
  const used = state.tags.all.reduce((colors: number[], tag: ITag) => {
    if (!colors.includes(tag.color)) colors.push(tag.color)
    return colors
  }, [])
  let available = state.labels.filter(l => !used.includes(l.id) && !l.hidden)
  if (!available.length) available = state.labels.filter(l => !l.hidden)
  const index = Math.floor(Math.random() * available.length)
  return available[index].id
}

/* 
  Problem:
    Randomly select the next unused color label

  State:
    labels: ILabel[]
    tags: ITag[]

  Questions:
    How do we handle the case where there are no unused colors available?

  Considerations:
    Don't select hidden labels
    How to we ensure we balance the results so that it will auto select the least used color?
*/
