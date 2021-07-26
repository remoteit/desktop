import React from 'react'
import { makeStyles, Tooltip, Chip, IconButton } from '@material-ui/core'
import { spacing } from '../styling'
import { Icon } from '../components/Icon'

type Props = {
  tag?: ITag
  labels: ILabel[]
  dot?: boolean
  onClick?: () => void
  onDelete?: () => void
}

export const Tag: React.FC<Props> = ({ tag, labels, dot, onClick, onDelete }) => {
  const css = useStyles()
  const getColor = (id = 0) => labels[id].color

  if (!tag) return null

  if (dot)
    return (
      <Tooltip
        title={
          <>
            <Icon name="tag" type="solid" size="xxxs" inlineLeft />
            {tag.name}
          </>
        }
        arrow
      >
        <span className={css.dot}>
          <Icon name="tag" color={getColor(tag.label)} type="solid" size="xxs" />
        </span>
      </Tooltip>
    )

  return (
    <Chip
      className={css.chip}
      label={
        <>
          <Icon name="tag" type="solid" size="xxs" />
          {tag.name}
        </>
      }
      size="small"
      style={{ color: getColor(tag.label) }}
      deleteIcon={
        <IconButton>
          <Icon name="times" size="xs" />
        </IconButton>
      }
      onClick={onClick}
      onDelete={onDelete}
    />
  )
}

const useStyles = makeStyles({
  dot: {
    '& + span': { marginLeft: spacing.xxs },
  },
  chip: {
    '& .MuiChip-label > *': { marginRight: spacing.xs },
    '& .MuiChip-deleteIconSmall': {
      marginLeft: -spacing.sm,
      marginRight: 0,
    },
  },
})
