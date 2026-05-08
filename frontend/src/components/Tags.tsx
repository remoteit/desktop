import React, { useMemo } from 'react'
import { Chip, BoxProps, Typography } from '@mui/material'
import { Tag } from './Tag'

export type TagProps = BoxProps & {
  tags: ITag[]
  small?: boolean
  max?: number
  showEmpty?: boolean
  hideLabels?: boolean
  onClick?: (tag: ITag) => void
  onDelete?: (tag: ITag) => void
}

export const Tags: React.FC<TagProps> = ({ tags, small, max = 1, showEmpty, hideLabels, onClick, onDelete }) => {
  const dot = tags.length > max && small
  const sortedTags = useMemo(() => [...tags].sort(nameSort), [tags])

  if (!tags.length && showEmpty)
    return (
      <Typography variant="caption" marginLeft={1}>
        No tags
      </Typography>
    )

  const tagElements = sortedTags.map((tag, index) => (
    <Tag
      key={index}
      dot={dot}
      tag={tag}
      hideLabels={hideLabels}
      onDelete={onDelete}
      onClick={onClick}
    />
  ))

  return <>{dot ? <Chip size="small" label={tagElements} /> : tagElements}</>
}

function nameSort(a: ITag, b: ITag) {
  return a.name.localeCompare(b.name)
}
