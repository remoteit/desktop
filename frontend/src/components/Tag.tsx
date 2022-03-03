import React from 'react'
import { makeStyles, Tooltip, Chip, IconButton } from '@material-ui/core'
import { spacing, FontSize } from '../styling'
import { useLabel } from '../hooks/useLabel'
import { Icon } from '../components/Icon'

type Props = {
  tag?: ITag
  labels: ILabel[]
  dot?: boolean
  size?: FontSize
  onClick?: () => void
  onDelete?: () => void
}

export const Tag: React.FC<Props> = ({ tag, labels, dot, size = 'xxs', onClick, onDelete }) => {
  const css = useStyles()
  const getColor = useLabel()

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
          <Icon name="tag" color={getColor(tag.color)} type="solid" size={size} />
        </span>
      </Tooltip>
    )

  return (
    <Chip
      className={css.chip}
      label={tag.name}
      size="small"
      style={{ color: getColor(tag.color) }}
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
    marginBottom: spacing.xxs,
    '& .MuiChip-label > *': { marginRight: spacing.xs },
    '& .MuiChip-deleteIconSmall': {
      marginLeft: -spacing.sm,
      marginRight: 0,
    },
  },
})
