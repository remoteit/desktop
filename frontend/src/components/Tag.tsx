import React from 'react'
import { makeStyles, Tooltip, Chip } from '@material-ui/core'
import { spacing } from '../styling'
import { Icon } from '../components/Icon'

type Props = {
  tag: ITag
  labels: ILabel[]
  dot?: boolean
  onClick?: () => void
  onDelete?: () => void
}

export const Tag: React.FC<Props> = ({ tag, labels, dot, onClick, onDelete }) => {
  const css = useStyles()
  const getColor = (id = 0) => labels[id].color

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
          <Icon name="circle" color={getColor(tag.label)} type="solid" size="xxs" />
        </span>
      </Tooltip>
    )

  return (
    <Chip
      className={css.chip}
      label={
        <>
          <Icon name="circle" type="solid" size="xxs" />
          {tag.name}
        </>
      }
      size="small"
      style={{ color: getColor(tag.label) }}
      deleteIcon={<Icon name="times" size="xs" />}
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
    '& .MuiChip-deleteIconSmall': { marginLeft: -1, marginRight: 8 },
  },
})
