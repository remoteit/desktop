import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { Chip, Box, BoxProps, Typography } from '@mui/material'
import { Tag } from './Tag'

type Props = BoxProps & {
  tags: ITag[]
  small?: boolean
  showEmpty?: boolean
  onClick?: (tag: ITag) => void
  onDelete?: (tag: ITag) => void
}

const AVERAGE_TAG_WIDTH = 85

export const Tags: React.FC<Props> = ({ tags, small, showEmpty, onClick, onDelete, ...props }) => {
  const { labels, count } = useSelector((state: ApplicationState) => ({
    labels: state.labels,
    count: Math.floor(state.ui.columnWidths.tags / AVERAGE_TAG_WIDTH),
  }))

  const dot = tags.length > count && small

  const Tags = tags
    .sort(nameSort)
    .map((tag, index) => (
      <Tag
        key={index}
        dot={dot}
        tag={tag}
        labels={labels}
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

  return <Box {...props}>{dot ? <Chip size="small" label={Tags} /> : Tags}</Box>
}

function nameSort(a: ITag, b: ITag) {
  return a.color < b.color ? -1 : 1
  // return a.name.localeCompare(b.name)
}
