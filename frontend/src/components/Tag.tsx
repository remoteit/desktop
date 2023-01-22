import React from 'react'
import { makeStyles } from '@mui/styles'
import { Tooltip, Chip, IconButton } from '@mui/material'
import { spacing, FontSize } from '../styling'
import { useLabel } from '../hooks/useLabel'
import { Icon } from '../components/Icon'

type Props = {
  tag?: ITag
  dot?: boolean
  size?: FontSize
  hideLabels?: boolean
  onClick?: () => void
  onDelete?: () => void
}

export const Tag: React.FC<Props> = ({ tag, dot, size = 'xxs', hideLabels, onClick, onDelete }) => {
  const getColor = useLabel()
  const color = tag && !hideLabels ? getColor(tag.color) : undefined
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
          {!hideLabels && <Icon name="tag" type="solid" size={size} />}
          {tag.name}
        </>
      }
      size="small"
      style={{ color }}
      deleteIcon={
        <IconButton size="small">
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
    marginBottom: 4,
    '& .MuiChip-label > *': { marginRight: spacing.xs },
    '& .MuiChip-deleteIconSmall': {
      marginLeft: -spacing.xs,
      marginRight: 0,
    },
  },
})
