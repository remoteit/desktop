import React from 'react'
import { Badge, IconButton, Menu, MenuItem } from '@material-ui/core'
import { Icon } from './Icon'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { makeStyles } from '@material-ui/core/styles'
import { fontSize } from '@remote.it/components/lib/styles/variables'

const options = [
  { value: 0, name: 'Alphabetical(A-Z)' },
  { value: 1, name: 'Alphabetical(Z-A)' },
  { value: 2, name: 'Creation Date (Newest)' },
  { value: 3, name: 'Creation Date (Oldest)' },
]

export const SortServices: React.FC = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const { devices } = useDispatch<Dispatch>()
  const open = Boolean(anchorEl)
  const css = useStyles()
  const [icon, setIcon] = React.useState('sort-amount-down')
  const [dot, setDot] = React.useState(false)
  const [optionSelected, setOptionSelected] = React.useState(0)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const servicesSort = async (type: number) => {
    setOptionSelected(type)
    let sortService
    switch (type) {
      case 0:
        sortService = (a: IService, b: IService) =>
          a.name.toLowerCase() > b.name.toLowerCase() ? 1 : a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 0
        break
      case 1:
        sortService = (a: IService, b: IService) =>
          a.name.toLowerCase() < b.name.toLowerCase() ? 1 : a.name.toLowerCase() > b.name.toLowerCase() ? -1 : 0
        break
      case 2:
        sortService = (a: IService, b: IService) => (a.createdAt > b.createdAt ? 1 : -1)
        break
      case 3:
        sortService = (a: IService, b: IService) => (a.createdAt < b.createdAt ? 1 : -1)
        break
    }
    optionSelected === 0 || optionSelected === 2 ? setIcon('sort-amount-down') : setIcon('sort-amount-up')
    setDot(true)
    if (sortService) {
      devices.set({ sortService })
    }
    handleClose()
  }

  return (
    <>
      <IconButton aria-label="more" aria-controls="long-menu" aria-haspopup="true" onClick={handleClick}>
        {dot ? (
          <Badge variant="dot" badgeContent={true} color="primary">
            <Icon name={icon} size="md" />
          </Badge>
        ) : (
          <Icon name={icon} size="md" />
        )}
      </IconButton>
      <Menu id="long-menu" anchorEl={anchorEl} keepMounted open={open} onClose={handleClose}>
        {options.map((option, index) => (
          <MenuItem
            key={index}
            selected={option.value === optionSelected}
            onClick={() => servicesSort(option.value)}
            className={css.list}
          >
            {option.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

const useStyles = makeStyles({
  list: {
    fontSize: fontSize.sm,
  },
})
