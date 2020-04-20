import React from 'react'
import { useSelector } from 'react-redux'
import { findService } from '../../models/devices'
import { ApplicationState } from '../../store'
import { useHistory, useLocation } from 'react-router-dom'
import { Tooltip, IconButton, Link } from '@material-ui/core'
import { removeDeviceName } from '../../helpers/nameHelper'
import { makeStyles } from '@material-ui/styles'
import { Icon } from '../Icon'
import { IDevice } from 'remote.it'
import { REGEX_LAST_PATH } from '../../constants'
import { spacing, colors, fontSizes } from '../../styling'

const pageNameMap: { [path: string]: string } = {
  connections: 'Connections',
  devices: 'Devices',
  network: 'Network',
  settings: 'Settings',
  setupServices: 'This Device',
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
    <div className={css.header}>
      <Tooltip title="back">
        <IconButton onClick={() => history.push(parentPath)}>
          <Icon name="chevron-left" size="md" fixedWidth />
        </IconButton>
      </Tooltip>
      {crumbs.reduce((result: any[], crumb, index) => {
        const crumbPath = (breadcrumb += `/${crumb}`)
        if (index > 0) result.push(<Icon key={crumbPath + 'Icon'} name="angle-left" size="sm" fixedWidth />)
        result.push(
          <Link key={crumbPath} onClick={() => history.push(crumbPath)}>
            {pageName(crumb)}
          </Link>
        )
        return result
      }, [])}
    </div>
  )
}

const useStyles = makeStyles({
  header: {
    marginLeft: spacing.md,
    marginBottom: -spacing.xs,
    '& .MuiLink-root': {
      fontFamily: 'Roboto Mono',
      color: colors.grayDarker,
      fontSize: fontSizes.xs,
      padding: `${spacing.xxs}px ${spacing.xs}px`,
      marginLeft: spacing.xs,
      marginRight: spacing.xs,
      letterSpacing: 2,
    },
  },
})
