import React from 'react'
import { Divider } from '@mui/material'
import { ListItemSetting } from './ListItemSetting'
import { spacing } from '../styling'

type Props = {
  tag: ITagFilter | undefined
  onUpdate: ({ tag }: { tag: ITagFilter }) => void
}

export const TagFilterToggle: React.FC<Props> = ({ tag, onUpdate }) => {
  const matchAny = tag?.operator !== 'ALL'
  return (
    <>
      <ListItemSetting
        label=""
        subLabel={`Match ${matchAny ? 'any tag' : 'all tags'}`}
        disabled={!tag}
        onClick={() =>
          tag &&
          onUpdate({
            tag: {
              values: tag.values,
              operator: matchAny ? 'ALL' : 'ANY',
            },
          })
        }
      />
      <Divider sx={{ marginBottom: `${spacing.sm}px`, marginRight: `${spacing.lg}px`, marginLeft: '70px' }} />
    </>
  )
}
