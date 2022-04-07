import React from 'react'
import { makeStyles, Divider } from '@material-ui/core'
import { ListItemSetting } from './ListItemSetting'
import { spacing } from '../styling'

type Props = {
  tag: ITagFilter | undefined
  onUpdate: ({ tag: ITagFilter }) => void
}

export const TagFilterToggle: React.FC<Props> = ({ tag, onUpdate }) => {
  const css = useStyles()
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
      <Divider className={css.divider} />
    </>
  )
}

const useStyles = makeStyles({
  divider: {
    marginBottom: spacing.sm,
    marginRight: spacing.lg,
    marginLeft: 70,
  },
})
