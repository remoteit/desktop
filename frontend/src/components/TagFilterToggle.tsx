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
      <Divider className={css.divider} />
      <ListItemSetting
        label=""
        // size="small"
        // toggle={matchAny}
        subLabel={`Match ${matchAny ? 'any tag' : 'all tags'}`}
        disabled={!tag}
        onClick={() =>
          tag &&
          onUpdate({
            tag: {
              names: tag.names,
              operator: matchAny ? 'ALL' : 'ANY',
            },
          })
        }
      />
    </>
  )
}

const useStyles = makeStyles({
  divider: {
    marginTop: spacing.sm,
    marginRight: spacing.lg,
    marginLeft: 70,
  },
})