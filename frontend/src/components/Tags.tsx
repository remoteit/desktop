import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { Chip, Box } from '@material-ui/core'
import { Tag } from './Tag'

type Props = {
  tags: ITag[]
  small?: boolean
  onClick?: (tag: ITag) => void
  onDelete?: (tag: ITag) => void
}

export const Tags: React.FC<Props> = ({ tags, small, onClick, onDelete }) => {
  const { labels, all } = useSelector((state: ApplicationState) => ({
    labels: state.labels,
    all: state.tags.all,
  }))

  const dot = tags.length > 1 && small

  const Tags = tags.map((tag, index) => (
    <Tag
      key={index}
      dot={dot}
      tag={all.find(t => t.name === tag.name)}
      labels={labels}
      onDelete={onDelete ? () => onDelete(tag) : undefined}
      onClick={onClick ? () => onClick(tag) : undefined}
    />
  ))

  return <Box>{dot ? <Chip size="small" label={Tags} /> : Tags}</Box>
}
