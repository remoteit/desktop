import React from 'react'
import { Chip, Box, BoxProps, Typography } from '@mui/material'
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

export const Tags: React.FC<TagProps> = ({
  tags,
  small,
  max = 1,
  showEmpty,
  hideLabels,
  onClick,
  onDelete,
  ...props
}) => {
  const dot = tags.length > max && small

  const Tags = [...tags]
    .sort(colorSort)
    .map((tag, index) => (
      <Tag
        key={index}
        dot={dot}
        tag={tag}
        hideLabels={hideLabels}
        onDelete={onDelete ? () => onDelete(tag) : undefined}
        onClick={onClick ? () => onClick(tag) : undefined}
      />
    ))

  if (!tags.length && showEmpty)
    return (
      <Typography variant="caption" marginLeft={1}>
        No tags
      </Typography>
    )

  return <>{dot ? <Chip size="small" label={Tags} /> : Tags}</>
}

function colorSort(a: ITag, b: ITag) {
  return a.color < b.color ? -1 : 1
  // return a.name.localeCompare(b.name)
}
