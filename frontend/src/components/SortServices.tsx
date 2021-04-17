import React from 'react'
import { IconButton, Menu, MenuItem } from '@material-ui/core'
import { Icon } from './Icon'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'

const options = [
  { value: 0, name: 'Alphabetical(A-Z)' },
  { value: 1, name: 'Alphabetical(Z-A)' },
  { value: 2, name: 'Creation Date (Newest)' },
  { value: 3, name: 'Creation Date (Oldest)' },
]

const ITEM_HEIGHT = 48

export const SortServices: React.FC = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const { devices } = useDispatch<Dispatch>()
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const servicesSort = async (type: number) => {
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

    if (sortService) {
      devices.set({ sortService })
    }
    handleClose()
  }

  return (
    <>
      <IconButton aria-label="more" aria-controls="long-menu" aria-haspopup="true" onClick={handleClick}>
        <Icon name="sort-amount-down" size="md" />
      </IconButton>
      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: ITEM_HEIGHT * 4.5,
            width: '20ch',
          },
        }}
      >
        {options.map((option, index) => (
          <MenuItem key={index} selected={option.value === 0} onClick={() => servicesSort(option.value)}>
            {option.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
