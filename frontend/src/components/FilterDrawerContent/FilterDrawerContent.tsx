import { createStyles, Drawer, makeStyles, Theme, Typography } from '@material-ui/core'
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
  { value: 'owner', filterName: 'Owner' },
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
  { title: 'Sort', filters: sortList },
  { title: 'Device State', filters: deviceList },
  { title: 'Owner', filters: ownerList },
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
    <Drawer
      className={css.drawer}
      variant="persistent"
      anchor="right"
      open={open}
      css={{
        paper: css.drawerPaper,
      }}
    >
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
        return <FilterSelector subtitle={f.title} filterList={f.filters} key={index} />
      })}
    </Drawer>
  )
}

const drawerWidth = 240

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    drawer: {
      width: drawerWidth,
      flexShrink: 0,
      zIndex: 0,
    },
    drawerPaper: {
      width: drawerWidth,
      height: 'calc(100% - 64px)',
      top: 64,
    },
    drawerHeader: {
      display: 'flex',
      alignItems: 'center',
      ...theme.mixins.toolbar,
      justifyContent: 'flex-start',
      paddingTop: 40,
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
