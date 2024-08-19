import React from 'react'
import { useSelector } from 'react-redux'
import { Tags, TagProps } from './Tags'
import { selectTags } from '../selectors/tags'

type Props = Omit<TagProps, 'tags'> & {
  tags: string[]
}

export const ReactiveTagNames: React.FC<Props> = ({ tags, ...props }) => {
  const allTags = useSelector(selectTags)
  console.log('allTags', allTags)
  const completeTags = tags.reduce((all: ITag[], tagName) => {
    const tag = allTags.find(t => t.name === tagName)
    if (tag) all.push(tag)
    return all
  }, [])
  console.log('completeTags', completeTags)
  return <Tags {...props} tags={completeTags} />
}
