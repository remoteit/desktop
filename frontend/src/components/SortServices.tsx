import React, { useEffect } from 'react'
import { Badge, IconButton, Menu, MenuItem } from '@material-ui/core'
import { Icon } from './Icon'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { makeStyles } from '@material-ui/core/styles'
import { fontSize } from '@remote.it/components/lib/styles/variables'

export interface ISortService {
  value: number
  name: string
  sortService: (a: IService, b: IService) => number
}
const options: ISortService[] = [
  {
    value: 0,
    name: 'Alpha A-Z',
    sortService: (a: IService, b: IService) =>
      a.name.toLowerCase() > b.name.toLowerCase() ? 1 : a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 0,
  },
  {
    value: 1,
    name: 'Alpha Z-A',
    sortService: (a: IService, b: IService) =>
      a.name.toLowerCase() < b.name.toLowerCase() ? 1 : a.name.toLowerCase() > b.name.toLowerCase() ? -1 : 0,
  },
  { value: 2, name: 'Newest first', sortService: (a: IService, b: IService) => (a.createdAt > b.createdAt ? 1 : -1) },
  { value: 3, name: 'Oldest first', sortService: (a: IService, b: IService) => (a.createdAt < b.createdAt ? 1 : -1) },
]

export const SortServices: React.FC = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const { devices } = useDispatch<Dispatch>()
  const open = Boolean(anchorEl)
  const css = useStyles()
  const [icon, setIcon] = React.useState('sort-amount-down')
  const [dot, setDot] = React.useState(false)
  const [optionSelected, setOptionSelected] = React.useState<ISortService>()

  useEffect(() => {
    servicesSort(options[0])
  }, [])

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const servicesSort = async (option: ISortService) => {
    setOptionSelected(option)
    option.value === 0 || option.value === 2 ? setIcon('sort-amount-down') : setIcon('sort-amount-up')
    setDot(!!option.value)
    devices.set({ sortServiceOption: option })
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
            onClick={() => servicesSort(option)}
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
