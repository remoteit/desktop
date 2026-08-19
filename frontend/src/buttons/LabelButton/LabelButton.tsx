import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../../store'
import { Tooltip, Select, MenuItem } from '@mui/material'
import { spacing } from '../../styling'

export const LabelButton: React.FC<{ device: IDevice }> = ({ device }) => {
  const [tooltip, setTooltip] = useState<boolean>(false)
  const { devices } = useDispatch<Dispatch>()
  const { labels } = useSelector((state: State) => state)
  const label = labels.find(l => l.id === device.attributes.color) || labels[0]

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
        sx={theme => ({
          border: `3px solid ${theme.palette.grayLighter.main}`,
          width: 30,
          height: 30,
          borderRadius: '50%',
          '& .MuiSelect-select:focus': { background: 'inherit' },
          '&:hover': { borderColor: theme.palette.primaryLight.main },
          '& .MuiSelect-icon': { display: 'none' },
          '& .MuiSelect-select': { marginLeft: '-10px' },
        })}
        value={label.id}
        onOpen={() => setTooltip(false)}
        onChange={event => handleUpdate(Number(event.target.value))}
        onClick={event => {
          event.preventDefault()
          event.stopPropagation()
        }}
      >
        {labels.map(l => (
          <MenuItem
            key={l.id}
            value={l.id}
            sx={theme => ({
              width: spacing.xxl,
              paddingRight: 0,
              paddingLeft: 0,
              marginLeft: `${spacing.xxs}px`,
              marginRight: `${spacing.xxs}px`,
              justifyContent: 'center',
              '& > em': {
                borderRadius: '50%',
                height: spacing.lg,
                width: spacing.lg,
                border: `1px solid ${theme.palette.grayLighter.main}`,
              },
            })}
          >
            <em style={{ backgroundColor: l.color }} />
          </MenuItem>
        ))}
      </Select>
    </Tooltip>
  )
}
