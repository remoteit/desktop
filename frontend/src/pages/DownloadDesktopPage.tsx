import React from 'react'
import { windowOpen } from '../services/Browser'
import { Box, Button, Typography } from '@material-ui/core'
import { useParams } from 'react-router-dom'
import { Body } from '../components/Body'
import { Icon } from '../components/Icon'

export const DownloadDesktopPage: React.FC = () => {
  let { icon } = useParams<{ icon?: string }>()
  if (icon === 'mac') icon = 'apple'

  const openDownloads = () => windowOpen('https://link.remote.it/download')

  return (
    <Body center>
      <Box marginLeft="60px">
        <Button
          color="primary"
          variant="contained"
          size="large"
          onClick={openDownloads}
          endIcon={<Icon name="launch" size="md" inline />}
        >
          Download
        </Button>
      </Box>
      <Box margin={`-200px 60px 20px 0 `}>
        <Icon name={icon} fontSize={260} color="grayLighter" type="brands" />
      </Box>
      <Typography variant="h3" align="center">
        Install the Desktop application or CLI to enable remote access.
      </Typography>
    </Body>
  )
}
