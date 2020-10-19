import { createStyles, makeStyles, Theme, Typography } from '@material-ui/core'
import React from 'react'
import { spacing } from '../../styling'
import { FilterSelector } from './FilterSelector'
import { Dispatch } from '../../store'
import { useDispatch } from 'react-redux'
import { Title } from '../Title'
import { CloseButton } from '../../buttons/CloseButton'

const sortList = [
  { value: 'name', filterName: 'Name' },
  { value: 'state', filterName: 'State' },
  { value: 'color', filterName: 'Color' },
]
const deviceList = [
  { value: 'all', filterName: 'All' },
  { value: 'active', filterName: 'Online' },
  { value: 'inactive', filterName: 'Offline' },
]
const ownerList = [
  { value: 'all', filterName: 'All' },
  { value: 'me', filterName: 'Me' },
  { value: 'others', filterName: 'Others' },
]
const sortFilter = [
  { title: 'Sort', options: sortList },
  { title: 'Device State', options: deviceList },
  { title: 'Owner', options: ownerList },
]

export function FilterDrawerContent({ open, close }: { open: boolean; close: (state: boolean) => void }): JSX.Element {
  const { devices } = useDispatch<Dispatch>()
  let owner = 'all',
    state = 'all',
    sort = 'name'
  const css = useStyles()
  const handleClose = () => {
    close(false)
  }
  const handleClear = () => {
    devices.set({
      filter: state,
      sort: sort,
      owner: owner,
      from: 0,
    })
    devices.fetch()
  }

  return (
    <div className={open ? css.drawer : css.drawerClose}>
      <div className={css.drawerHeader}>
        <Typography className={css.filter}>
          <Title>Filter</Title>
        </Typography>
        <Typography variant="subtitle1" className={css.clear} color="primary" onClick={handleClear}>
          clear
        </Typography>
        <CloseButton onClick={handleClose} />
      </div>
      {sortFilter.map((f, index) => {
        return <FilterSelector subtitle={f.title} filterList={f.options} key={index} />
      })}
    </div>
  )
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    drawer: {
      transition: 'width 200ms ease-out',
      borderLeft: '1px solid #dbdbdb',
    },
    drawerClose: {
      display: 'none',
    },
    drawerHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      marginBottom: 30,
      top: 24,
      position: 'relative',
      minWidth: 280,
    },
    clear: {
      minHeight: 0,
      padding: 0,
      cursor: 'pointer',
    },
    filter: {
      paddingLeft: spacing.md,
      minWidth: 170,
    },
  })
)
