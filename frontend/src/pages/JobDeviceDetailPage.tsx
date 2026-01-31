import React from 'react'
import { State, Dispatch } from '../store'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { JobStatusIcon } from '../components/JobStatusIcon'
import { Box, Typography, useMediaQuery } from '@mui/material'
import { JobAttribute } from '../components/JobAttributes'
import { selectScript } from '../selectors/scripting'
import { DataDisplay } from '../components/DataDisplay'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Timestamp } from '../components/Timestamp'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { radius } from '../styling'
import { Pre } from '../components/Pre'
import { HIDE_SIDEBAR_WIDTH } from '../constants'

type Props = {
  showBack?: boolean
  showMenu?: boolean
}

export const JobDeviceDetailPage: React.FC<Props> = ({ showBack, showMenu }) => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const { fileID, jobID, jobDeviceID } = useParams<{ fileID?: string; jobID?: string; jobDeviceID?: string }>()
  const sidebarHidden = useMediaQuery(`(max-width:${HIDE_SIDEBAR_WIDTH}px)`)
  const script = useSelector((state: State) => selectScript(state, undefined, fileID))
  const job = script?.jobs.find(j => j.id === jobID) || script?.jobs[0]
  const jobDevice = job?.jobDevices.find(jd => jd.id === jobDeviceID)
  const attributes =
    jobDevice?.attributes.map(
      a => new JobAttribute({ id: `attribute-${a.key}`, label: a.key, value: () => a.value })
    ) || []

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      integrated
      header={
        <>
          <Typography variant="h1">
            {showMenu && sidebarHidden && (
              <IconButton
                name="bars"
                size="md"
                color="grayDarker"
                onClick={() => dispatch.ui.set({ sidebarMenu: true })}
              />
            )}
            {showBack && (
              <IconButton
                name="chevron-left"
                onClick={() => history.push(`/script/${fileID}/${jobID || 'latest'}`)}
                size="md"
                title="Back"
              />
            )}
            <Box marginRight={2}>
              <JobStatusIcon status={jobDevice?.status} size="xl" device />
            </Box>
            <Title>{jobDevice?.device?.name || 'Unknown'}</Title>
            <IconButton name="router" to={`/devices/${jobDevice?.device.id}`} title="Device details" />
          </Typography>
          {jobDevice?.updated && (
            <Typography marginLeft={11} marginTop={2} gutterBottom variant="caption" component="p">
              <Timestamp date={new Date(jobDevice.updated)} />
            </Typography>
          )}
        </>
      }
    >
      <Gutters>
        {attributes.length ? (
          <Box bgcolor="grayLightest.main" borderRadius={radius.lg + 'px'} paddingY={2} paddingX={4}>
            <DataDisplay attributes={attributes} />
          </Box>
        ) : (
          <Notice fullWidth>No return values from this device</Notice>
        )}
      </Gutters>
    </Container>
  )
}
