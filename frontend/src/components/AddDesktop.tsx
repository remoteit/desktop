import React from 'react'
import { windowOpen } from '../services/Browser'
import { Button, Typography } from '@material-ui/core'
import { Icon } from './Icon'

export const AddDesktop: React.FC = () => {
  const openDownloads = () => windowOpen('https://link.remote.it/download')

  return (
    <>
      <Typography variant="h3" align="center">
        Install the Desktop application or CLI to enable remote access.
      </Typography>
      <section>
        <Button
          color="primary"
          variant="contained"
          size="large"
          onClick={openDownloads}
          endIcon={<Icon name="launch" size="md" inline />}
        >
          Download
        </Button>
      </section>
    </>
  )
}
