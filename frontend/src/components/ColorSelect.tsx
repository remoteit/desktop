import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { State } from '../store'
import { Tooltip, Select, MenuItem } from '@mui/material'
import { spacing } from '../styling'
import { Icon } from './Icon'

export const ColorSelect: React.FC<{ tag: ITag; onSelect: (color: number) => void }> = ({ tag, onSelect }) => {
  const [tooltip, setTooltip] = useState<boolean>(false)
  const labels = useSelector((state: State) => state.labels).filter(l => !l.hidden)
  const selected = labels.find(l => l.id === tag.color) || labels[0]

  return (
    <Tooltip title={`Change ${selected.name}`} open={tooltip}>
      <Select
        disableUnderline
        variant="standard"
        value={selected.id.toString()}
        sx={{
          '& .MuiSelect-icon': { display: 'none' },
          '& .MuiSelect-select': { paddingRight: '0 !important' },
        }}
        MenuProps={{
          sx: theme => ({
            '& .MuiPaper-root': {
              marginLeft: `${-spacing.md}px`,
              border: `0.5px solid ${theme.palette.grayLighter.main}`,
            },
          }),
        }}
        onMouseEnter={() => setTooltip(true)}
        onMouseLeave={() => setTooltip(false)}
        onOpen={() => setTooltip(false)}
        onChange={event => onSelect(Number(event.target.value))}
        onClick={event => {
          event.preventDefault()
          event.stopPropagation()
        }}
      >
        {labels.map(
          l =>
            l.id.toString() && (
              <MenuItem
                key={l.id}
                value={l.id.toString()}
                sx={{
                  width: spacing.xxl,
                  paddingRight: 0,
                  paddingLeft: 0,
                  marginLeft: `${spacing.xxs}px`,
                  marginRight: `${spacing.xxs}px`,
                  justifyContent: 'center',
                }}
              >
                <Icon name="tag" color={l.color} type="solid" size="md" />
              </MenuItem>
            )
        )}
      </Select>
    </Tooltip>
  )
}
