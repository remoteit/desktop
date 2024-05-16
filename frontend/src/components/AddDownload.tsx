import React from 'react'
import browser, { windowOpen, getOs } from '../services/browser'
import { safeHostname } from '@common/nameHelper'
import { useSelector } from 'react-redux'
import { State } from '../store'
import { Button, Typography } from '@mui/material'
import { IPlatform } from '../platforms'
import { Link } from './Link'
import { Icon } from './Icon'

export const AddDownload: React.FC<{ platform: IPlatform }> = ({ platform }) => {
  const hostname = useSelector((state: State) => safeHostname(state.backend.environment.hostname, []))
  const openDownloads = () => windowOpen(platform.installation?.link, '_blank', browser.isAndroid)

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
        sx={{ marginTop: 3, marginBottom: 3, maxWidth: '400px' }}
        onClick={openDownloads}
        endIcon={
          <Icon
            name={browser.isAndroid ? 'google-play' : 'launch'}
            type={browser.isAndroid ? 'brands' : undefined}
            size="md"
            inline
          />
        }
      >
        {browser.isAndroid ? 'Install' : browser.hasBackend ? 'Downloads Page' : 'View'}
      </Button>
      {platform.installation?.altLink && (
        <Typography variant="body2" color="textSecondary">
          or add<Link to={platform.installation.altLink}>this device ({hostname})</Link>
        </Typography>
      )}
    </>
  )
}
