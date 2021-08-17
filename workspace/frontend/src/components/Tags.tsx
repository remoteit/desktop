import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { Chip } from '@material-ui/core'
import { Tag } from './Tag'

type Props = {
  ids: number[]
  small?: boolean
  onClick?: (id: number) => void
  onDelete?: (id: number) => void
}

export const Tags: React.FC<Props> = ({ ids, small, onClick, onDelete }) => {
  const { labels, all } = useSelector((state: ApplicationState) => ({
    labels: state.labels,
    all: state.tags.all,
  }))

  const dot = ids.length > 1 && small

  const Tags = ids.map((id, index) => (
    <Tag
      key={index}
      dot={dot}
      tag={all.find(t => t.id === id)}
      labels={labels}
      onDelete={onDelete ? () => onDelete(id) : undefined}
      onClick={onClick ? () => onClick(id) : undefined}
    />
  ))

  return dot ? <Chip size="small" label={Tags} /> : <>{Tags}</>
}
