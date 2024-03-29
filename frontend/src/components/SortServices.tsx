import React from 'react'
import { selectDeviceModelAttributes } from '../selectors/devices'
import { IconButton, Menu, MenuItem } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { State, Dispatch } from '../store'
import { Icon } from './Icon'

export function getSortOptions(key: ISortServiceType) {
  const option = optionSortServices[key]
  return option || {}
}

const optionSortServices: IOptionServiceSort = {
  ATOZ: {
    name: 'Alpha A-Z',
    sortService: (a: IService, b: IService) =>
      a.name.toLowerCase() > b.name.toLowerCase() ? 1 : a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 0,
    icon: 'sort-alpha-down',
  },
  ZTOA: {
    name: 'Alpha Z-A',
    sortService: (a: IService, b: IService) =>
      a.name.toLowerCase() < b.name.toLowerCase() ? 1 : a.name.toLowerCase() > b.name.toLowerCase() ? -1 : 0,
    icon: 'sort-alpha-up',
  },
  NEWEST: {
    name: 'Newest first',
    sortService: (a: IService, b: IService) => (a.createdAt < b.createdAt ? 1 : -1),
    icon: 'sort-amount-down',
  },
  OLDEST: {
    name: 'Oldest first',
    sortService: (a: IService, b: IService) => (a.createdAt > b.createdAt ? 1 : -1),
    icon: 'sort-amount-up',
  },
}

export const SortServices: React.FC = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const { devices } = useDispatch<Dispatch>()
  const sortService = useSelector((state: State) => selectDeviceModelAttributes(state).sortServiceOption)
  const option = getSortOptions(sortService)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const servicesSort = async (option?: ISortServiceType) => {
    devices.set({ sortServiceOption: option })
    handleClose()
  }

  if (!option) return null

  return (
    <>
      <IconButton onClick={handleClick}>
        <Icon name={option.icon} size="md" />
      </IconButton>
      <Menu anchorEl={anchorEl} keepMounted open={open} onClose={handleClose}>
        {Object.keys(optionSortServices).map(key => (
          <MenuItem
            key={key}
            selected={key === sortService}
            onClick={() => servicesSort(key as ISortServiceType)}
            dense
          >
            {optionSortServices[key].name}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
