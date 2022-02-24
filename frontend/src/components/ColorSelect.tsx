import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { Tooltip, Select, MenuItem, makeStyles } from '@material-ui/core'
import { spacing } from '../styling'
import { Icon } from './Icon'

export const ColorSelect: React.FC<{ tag: ITag; onSelect: (color: number) => void }> = ({ tag, onSelect }) => {
  const [tooltip, setTooltip] = useState<boolean>(false)
  const { labels } = useSelector((state: ApplicationState) => state)
  const selected = labels.find(l => l.id === tag.color) || labels[0]
  const css = useStyles()

  return (
    <Tooltip title={`Change ${selected.name}`} open={tooltip}>
      <Select
        disableUnderline
        value={selected.id}
        classes={{ icon: css.icon, selectMenu: css.menu }}
        MenuProps={{ classes: { paper: css.menuPaper } }}
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
            l.id && (
              <MenuItem key={l.id} value={l.id} className={css.item}>
                <Icon name="tag" color={l.color} type="solid" size="md" />
              </MenuItem>
            )
        )}
      </Select>
    </Tooltip>
  )
}
const useStyles = makeStyles(({ palette }) => ({
  select: {
    border: '1px solid blue',
  },
  item: {
    width: spacing.xxl,
    paddingRight: 0,
    paddingLeft: 0,
    marginLeft: spacing.xxs,
    marginRight: spacing.xxs,
    justifyContent: 'center',
  },
  menu: { paddingRight: '0 !important' },
  menuPaper: { marginLeft: -spacing.md },
  icon: { display: 'none' },
}))
