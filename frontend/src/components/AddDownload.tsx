import React from 'react'
import { safeHostname } from '../shared/nameHelper'
import { windowOpen, isPortal, getOs } from '../services/Browser'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { Button, Typography } from '@mui/material'
import { IPlatform } from '../platforms'
import { DesktopUI } from './DesktopUI'
import { Link } from './Link'
import { Icon } from './Icon'

export const AddDownload: React.FC<{ platform: IPlatform }> = ({ platform }) => {
  const hostname = useSelector((state: ApplicationState) => safeHostname(state.backend.environment.hostname, []))
  const openDownloads = () => windowOpen(platform.installation?.link)

  return (
    <>
      <Typography variant="body2" color="textSecondary">
        {platform.installation?.qualifier}
      </Typography>
      <Typography variant="h3">{platform.installation?.instructions}</Typography>
      <Button
        color="primary"
        variant="contained"
        size="large"
        onClick={openDownloads}
        endIcon={<Icon name="launch" size="md" inline />}
      >
        {isPortal() ? 'Download' : 'Downloads Page'}
      </Button>
      <DesktopUI>
        {getOs() === platform.id && (
          <Typography variant="body2" color="textSecondary">
            or add<Link to="/devices/setup">this device ({hostname})</Link>
          </Typography>
        )}
      </DesktopUI>
    </>
  )
}
