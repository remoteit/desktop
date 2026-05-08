import React from 'react'
import { Tooltip, Chip, IconButton, Box } from '@mui/material'
import { spacing, Sizes } from '../styling'
import { useLabel } from '../hooks/useLabel'
import { Icon } from '../components/Icon'

type Props = {
  tag?: ITag
  dot?: boolean
  size?: Sizes
  hideLabels?: boolean
  onClick?: (tag: ITag) => void
  onDelete?: (tag: ITag) => void
}

export const Tag: React.FC<Props> = React.memo(
  ({ tag, dot, size = 'xs', hideLabels, onClick, onDelete }) => {
    const getColor = useLabel()
    const color = tag && !hideLabels ? getColor(tag.color) : undefined

    if (!tag) return null
    const handleClick = onClick ? () => onClick(tag) : undefined
    const handleDelete = onDelete ? () => onDelete(tag) : undefined

    if (dot)
      return (
        <Tooltip
          slotProps={{
            tooltip: {
              sx: {
                backgroundColor: color,
                '& .MuiTooltip-arrow': { color },
              },
            },
          }}
          title={
            <>
              <Icon name="tag" type="solid" size="xxxs" inlineLeft />
              {tag.name}
            </>
          }
          placement="top"
          arrow
        >
          <Box component="span" sx={{ '& + span': { marginLeft: `${spacing.xxs}px` } }}>
            <Icon name="tag" color={color} type="solid" size={size} />
          </Box>
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
        onClick={handleClick}
        onDelete={handleDelete}
      />
    )
  }
)
