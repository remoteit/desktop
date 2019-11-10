import React from 'react'
import { useSelector } from 'react-redux'
import { findService } from '../../models/devices'
import { ApplicationState } from '../../store'
import { useHistory, useLocation } from 'react-router-dom'
import { Tooltip, IconButton, Link } from '@material-ui/core'
import { removeDeviceName } from '../../helpers/nameHelper'
import { makeStyles } from '@material-ui/styles'
import { Body } from '../Body'
import { Icon } from '../Icon'
import { IDevice, IService } from 'remote.it'
import { REGEX_LAST_PATH } from '../../constants'
import styles from '../../styling'

const pageNameMap: { [path: string]: string } = {
  connections: 'Connections',
  devices: 'Remote Devices',
  setup: 'Local Setup',
  network: 'Network',
  settings: 'Settings',
}

export const Breadcrumbs: React.FC = ({ children }) => {
  const css = useStyles()
  const history = useHistory()
  const location = useLocation()
  const devices = useSelector((state: ApplicationState) => state.devices.all)
  const parentPath = location.pathname.replace(REGEX_LAST_PATH, '')
  const crumbs = parentPath.substr(1).split('/')

  const findDevice = (id: string) => devices.find(d => d.id === id)
  const pageName = (path: string) => {
    const name: string | undefined = pageNameMap[path]
    if (name) return name

    const device: IDevice | undefined = findDevice(path)
    if (device) return device.name

    const [service, d] = findService(devices, path)
    if (service && d) return removeDeviceName(d.name, service.name)

    const match = path.match(REGEX_LAST_PATH)
    if (match) return match[0]

    return path
  }

  let breadcrumb: string = ''

  return (
    <div className={css.container}>
      <div className={css.header}>
        <Tooltip title="back">
          <IconButton onClick={() => history.push(parentPath)}>
            <Icon name="chevron-left" size="md" fixedWidth />
          </IconButton>
        </Tooltip>
        {crumbs.reduce((result: any[], crumb, index) => {
          const crumbPath = (breadcrumb += `/${crumb}`)
          if (index > 0) result.unshift(<Icon key={crumbPath + 'Icon'} name="angle-left" size="sm" fixedWidth />)
          result.unshift(
            <Link key={crumbPath} onClick={() => history.push(crumbPath)}>
              {pageName(crumb)}
            </Link>
          )
          return result
        }, [])}
      </div>
      <Body>{children}</Body>
    </div>
  )
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    alignItems: 'stretch',
    flexFlow: 'column',
    height: '100%',
  },
  header: {
    // backgroundColor: styles.colors.grayLighter,
    // borderBottom: `1px solid ${styles.colors.grayLight}`,
    marginTop: styles.spacing.lg,
    marginLeft: styles.spacing.sm,
    '& .MuiLink-root': {
      fontFamily: 'Roboto Mono',
      color: styles.colors.grayDarker,
      fontSize: styles.fontSizes.xs,
      letterSpacing: 2,
    },
  },
})
