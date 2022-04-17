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
  const getColor = useLabel()
  const color = tag ? getColor(tag.color) : undefined
  const css = useStyles({ color })

  if (!tag) return null

  if (dot)
    return (
      <Tooltip
        classes={{ tooltip: css.tooltip }}
        title={
          <>
            <Icon name="tag" type="solid" size="xxxs" inlineLeft />
            {tag.name}
          </>
        }
        placement="top"
        arrow
      >
        <span className={css.dot}>
          <Icon name="tag" color={color} type="solid" size={size} />
        </span>
      </Tooltip>
    )

  return (
    <Chip
      className={css.chip}
      label={
        <>
          <Icon name="tag" type="solid" size={size} />
          {tag.name}
        </>
      }
      size="small"
      style={{ color }}
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
  tooltip: ({ color }: any) => ({
    backgroundColor: color,
    '& .MuiTooltip-arrow': { color },
  }),
  dot: {
    '& + span': { marginLeft: spacing.xxs },
  },
  chip: {
    marginBottom: 2,
    marginTop: 2,
    '& .MuiChip-label > *': { marginRight: spacing.xs },
    '& .MuiChip-deleteIconSmall': {
      marginLeft: -spacing.sm,
      marginRight: 0,
    },
  },
})
