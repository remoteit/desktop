import React from 'react'
import { makeStyles } from '@mui/styles'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { Chip, Menu, MenuItem } from '@mui/material'
import { KEY_APPS } from '../shared/applications'
import { spacing } from '../styling'
import { Gutters } from './Gutters'
import { Icon } from './Icon'

type Props = {
  selected?: IApplicationType['id']
  disabled?: boolean
  onSelect: (selected: IApplicationType) => void
}

export const ServiceFormApplications: React.FC<Props> = ({ selected, disabled, onSelect }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const { allApplications } = useSelector((state: ApplicationState) => ({
    allApplications: state.applicationTypes.all,
  }))
  const css = useStyles()
  const keyApplications = allApplications.filter(a => KEY_APPS.includes(a.id))
  const otherApplications = allApplications.filter(a => !keyApplications.find(k => k.id === a.id))
  const otherSelected = otherApplications.find(a => a.id === selected)

  return (
    <Gutters top={null} className={css.item}>
      {keyApplications.map(
        t =>
          t.scheme && (
            <Chip
              label={t.name}
              key={t.id}
              disabled={disabled}
              onClick={() => onSelect(t)}
              color={t.id === selected ? 'primary' : undefined}
              variant="filled"
            />
          )
      )}
      <Chip
        label={
          <>
            {otherSelected?.name || 'More'}
            <Icon name="chevron-down" size="sm" inline />
          </>
        }
        disabled={disabled}
        onClick={event => setAnchorEl(event.currentTarget)}
        color={otherSelected ? 'primary' : undefined}
        variant="filled"
      />
      <Menu open={!!anchorEl} anchorEl={anchorEl} onClose={() => setAnchorEl(null)}>
        {otherApplications.map(a => (
          <MenuItem
            key={a.id}
            value={a.id}
            onClick={e => {
              onSelect(a)
              setAnchorEl(null)
            }}
            dense
          >
            {a.name}
          </MenuItem>
        ))}
      </Menu>
    </Gutters>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    '& > *': { margin: spacing.xxs },
  },
}))
