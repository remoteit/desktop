import React from 'react'
import { windowOpen } from '../services/Browser'
import { Button, Typography } from '@material-ui/core'
import { IPlatform } from '../platforms'
import { Icon } from './Icon'

export const AddDownload: React.FC<{ platform: IPlatform }> = ({ platform }) => {
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
        Download
      </Button>
    </>
  )
}
