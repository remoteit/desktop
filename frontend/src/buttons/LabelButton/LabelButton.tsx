import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { Tooltip, Select, MenuItem, makeStyles } from '@material-ui/core'
import { colors, spacing } from '../../styling'

export const LabelButton: React.FC<{ device: IDevice }> = ({ device }) => {
  const [tooltip, setTooltip] = useState<boolean>(false)
  const { devices } = useDispatch<Dispatch>()
  const { labels } = useSelector((state: ApplicationState) => state)
  const label = labels.find(l => l.id === device.attributes.color) || labels[0]
  const css = useStyles()

  function handleUpdate(color: number) {
    device.attributes = { ...device.attributes, color }
    devices.setAttributes(device)
  }

  return (
    <Tooltip title={`Label ${label.name}`} open={tooltip}>
      <Select
        disableUnderline
        onMouseEnter={() => setTooltip(true)}
        onMouseLeave={() => setTooltip(false)}
        style={{ backgroundColor: label.color }}
        className={css.all}
        classes={{ icon: css.icon, selectMenu: css.menu }}
        value={label.id}
        onOpen={() => setTooltip(false)}
        onChange={event => handleUpdate(Number(event.target.value))}
        onClick={event => {
          event.preventDefault()
          event.stopPropagation()
        }}
      >
        {labels.map(l => (
          <MenuItem key={l.id} value={l.id} className={css.item}>
            <em style={{ backgroundColor: l.color }} />
          </MenuItem>
        ))}
      </Select>
    </Tooltip>
  )
}
const useStyles = makeStyles({
  all: {
    border: `3px solid ${colors.grayLighter}`,
    width: 30,
    height: 30,
    borderRadius: '50%',
    '& .MuiSelect-select:focus': { background: 'none' },
    '&:hover': { borderColor: colors.primaryLight },
  },
  item: {
    width: spacing.xxl,
    paddingRight: 0,
    justifyContent: 'center',
    '& > em': {
      borderRadius: '50%',
      height: spacing.lg,
      width: spacing.lg,
      border: `1px solid ${colors.grayLighter}`,
    },
  },
  menu: { marginLeft: -10 },
  icon: { display: 'none' },
})
