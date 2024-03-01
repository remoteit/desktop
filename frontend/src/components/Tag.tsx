import React from 'react'
import { makeStyles } from '@mui/styles'
import { Tooltip, Chip, IconButton, alpha } from '@mui/material'
import { spacing, Sizes } from '../styling'
import { useLabel } from '../hooks/useLabel'
import { Icon } from '../components/Icon'

type Props = {
  tag?: ITag
  dot?: boolean
  size?: Sizes
  hideLabels?: boolean
  onClick?: () => void
  onDelete?: () => void
}

export const Tag: React.FC<Props> = ({ tag, dot, size = 'xs', hideLabels, onClick, onDelete }) => {
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
      label={
        <>
          {!hideLabels && <Icon name="tag" type="solid" size={size} color={color} />}
          {tag.name}
        </>
      }
      size="small"
      sx={{
        color: 'grayDarker.main',
        marginBottom: 0.3,
        '& .MuiChip-label > *': { marginRight: 1 },
        '& .MuiChip-deleteIconSmall': {
          marginLeft: -1,
          marginRight: 0,
        },
      }}
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
})
