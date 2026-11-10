import React, { useMemo } from 'react'
import { Chip, BoxProps, Typography } from '@mui/material'
import { byName } from '../helpers/utilHelper'
import { Tag } from './Tag'

export type TagProps = BoxProps & {
  tags: ITag[]
  small?: boolean
  max?: number
  showEmpty?: boolean
  hideLabels?: boolean
  locked?: { names: string[]; title: string } // tags held by something else (a device's product): not deleted here
  onClick?: (tag: ITag) => void
  onDelete?: (tag: ITag) => void
}

export const Tags: React.FC<TagProps> = ({
  tags,
  small,
  max = 1,
  showEmpty,
  hideLabels,
  locked,
  onClick,
  onDelete,
}) => {
  const dot = tags.length > max && small
  const sortedTags = useMemo(() => [...tags].sort(byName), [tags])

  if (!tags.length && showEmpty)
    return (
      <Typography variant="caption" marginLeft={1}>
        No tags
      </Typography>
    )

  const tagElements = sortedTags.map((tag, index) => {
    const held = locked?.names.includes(tag.name)
    return (
      <Tag
        key={index}
        dot={dot}
        tag={tag}
        hideLabels={hideLabels}
        locked={held ? locked?.title : undefined}
        onDelete={held ? undefined : onDelete}
        onClick={onClick}
      />
    )
  })

  return <>{dot ? <Chip size="small" label={tagElements} /> : tagElements}</>
}

