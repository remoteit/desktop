import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { Chip, Box } from '@material-ui/core'
import { Tag } from './Tag'

type Props = {
  tags: ITag[]
  small?: boolean
  showEmpty?: boolean
  onClick?: (tag: ITag) => void
  onDelete?: (tag: ITag) => void
}

export const Tags: React.FC<Props> = ({ tags, small, showEmpty, onClick, onDelete }) => {
  const labels = useSelector((state: ApplicationState) => state.labels)

  const dot = tags.length > 1 && small

  const Tags = tags.map((tag, index) => (
    <Tag
      key={index}
      dot={dot}
      tag={tag}
      labels={labels}
      onDelete={onDelete ? () => onDelete(tag) : undefined}
      onClick={onClick ? () => onClick(tag) : undefined}
    />
  ))

  if (!tags.length && showEmpty) return <>None</>

  return <Box>{dot ? <Chip size="small" label={Tags} /> : Tags}</Box>
}
