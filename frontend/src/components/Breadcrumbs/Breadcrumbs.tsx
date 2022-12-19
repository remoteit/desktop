import React, { useEffect } from 'react'
import { isDev } from '../../services/Browser'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { makeStyles } from '@mui/styles'
import { Typography } from '@mui/material'
import { attributeName } from '../../shared/nameHelper'
import { ApplicationState } from '../../store'
import { getAllDevices, findById } from '../../selectors/devices'
import { selectNetworks } from '../../selectors/networks'
import { spacing, fontSizes } from '../../styling'
import { REGEX_LAST_PATH } from '../../shared/constants'
import { Icon } from '../Icon'
import { Link } from '../Link'

const BASE_TITLE = 'Remote.It'

const pageNameMap: { [path: string]: string } = {
  connections: 'Connections',
  devices: 'Devices',
  networks: 'Networks',
  settings: 'Settings',
  setupServices: 'This Device',
}

export const Breadcrumbs: React.FC<{ show?: boolean }> = ({ show }) => {
  const css = useStyles()
  const location = useLocation()
  const { devices, networks } = useSelector((state: ApplicationState) => ({
    devices: getAllDevices(state),
    networks: selectNetworks(state),
  }))
  const parentPath = location.pathname.replace(REGEX_LAST_PATH, '')
  const crumbs = parentPath.substring(1).split('/')

  const findDevice = (id: string) => devices.find((d: IDevice) => d.id === id)
  const pageName = (path: string) => {
    const name: string | undefined = pageNameMap[path]
    if (name) return name

    const device: IDevice | undefined = findDevice(path)
    if (device) return attributeName(device)

    const [service, d] = findById(devices, path)
    if (service && d) return attributeName(service)

    const network = networks.find(n => n.id === path)
    if (network) return network.name

    const match = path.match(REGEX_LAST_PATH)
    if (match) return match[0]

    return path
  }

  let breadcrumb: string = ''

  useEffect(() => {
    const parts = location.pathname.split('/').map(crumb => pageName(crumb))
    document.title = BASE_TITLE + parts.join(' - ')
  }, [crumbs])

  if (!show || !crumbs.join())
    return false && isDev() ? <Typography variant="caption">{location.pathname}</Typography> : null

  return (
    <Typography className={css.header}>
      {crumbs.reduce((result: any[], crumb, index) => {
        const crumbPath = (breadcrumb += `/${crumb}`)
        if (index > 0) result.push(<Icon key={crumbPath + 'Icon'} name="angle-left" size="sm" fixedWidth />)
        result.push(
          <Link key={crumbPath} to={crumbPath}>
            {pageName(crumb)}
          </Link>
        )
        return result
      }, [])}
    </Typography>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  header: {
    marginTop: spacing.sm,
    marginLeft: spacing.lg,
    marginBottom: -spacing.xs,
    color: palette.gray.main,
    position: 'relative',
    zIndex: 2,
    '& .MuiTypography-root': { marginLeft: 0 },
    '& .MuiIconButton-root': { margin: `0 ${spacing.xxs}px` },
    '& .MuiLink-root': {
      fontFamily: 'Roboto Mono',
      textDecoration: 'none',
      fontSize: fontSizes.xxs,
      color: palette.grayDark.main,
      padding: `${spacing.md}px ${spacing.xs}px`,
      marginLeft: spacing.xxs,
      marginRight: spacing.xxs,
    },
  },
}))
