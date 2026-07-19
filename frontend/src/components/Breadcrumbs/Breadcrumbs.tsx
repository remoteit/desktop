import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { Typography } from '@mui/material'
import { State } from '../../store'
import { getAllDevices, findById } from '../../selectors/devices'
import { selectNetworks } from '../../selectors/networks'
import { spacing, fontSizes } from '../../styling'
import { REGEX_LAST_PATH } from '../../constants'
import { Icon } from '../Icon'
import { Link } from '../Link'

const BASE_TITLE = 'Remote.It Application'

const pageNameMap: { [path: string]: string } = {
  connections: 'Connections',
  devices: 'Devices',
  networks: 'Networks',
  settings: 'Settings',
  setupServices: 'This Device',
}

export const Breadcrumbs: React.FC = () => {
  const location = useLocation()
  const { devices, networks } = useSelector((state: State) => ({
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
    if (device) return device.name

    const [service, d] = findById(devices, path)
    if (service && d) return service.name

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

  if (!crumbs.join()) return null

  return (
    <Typography
      sx={theme => ({
        marginTop: `${spacing.sm}px`,
        marginLeft: `${spacing.lg}px`,
        marginBottom: `${-spacing.xs}px`,
        color: theme.palette.gray.main,
        position: 'relative',
        zIndex: 2,
        '& .MuiTypography-root': { marginLeft: 0 },
        '& .MuiIconButton-root': { margin: `0 ${spacing.xxs}px` },
        '& .MuiLink-root': {
          fontFamily: 'Roboto Mono',
          textDecoration: 'none',
          fontSize: fontSizes.xxs,
          color: theme.palette.grayDark.main,
          padding: `${spacing.md}px ${spacing.xs}px`,
          marginLeft: `${spacing.xxs}px`,
          marginRight: `${spacing.xxs}px`,
        },
      })}
    >
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
