import React from 'react'
import { State } from '../store'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { JobStatusIcon } from '../components/JobStatusIcon'
import { Box, Typography } from '@mui/material'
import { JobAttribute } from '../components/JobAttributes'
import { selectScript } from '../selectors/scripting'
import { DataDisplay } from '../components/DataDisplay'
import { Container } from '../components/Container'
import { Duration } from '../components/Duration'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { radius } from '../styling'

export const JobDeviceDetailPage: React.FC = () => {
  const { fileID, jobID, jobDeviceID } = useParams<{ fileID?: string; jobID?: string; jobDeviceID?: string }>()
  const script = useSelector((state: State) => selectScript(state, undefined, fileID, jobID))
  const jobDevice = script?.job?.jobDevices.find(jd => jd.id === jobDeviceID)
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
            <Box marginRight={2}>
              <JobStatusIcon status={jobDevice?.status} size="xl" />
            </Box>
            <Title>{jobDevice?.device?.name || 'Unknown'}</Title>
          </Typography>
          {jobDevice?.updated && (
            <Typography marginLeft={9.5} gutterBottom variant="caption" component="p">
              <Duration startDate={new Date(jobDevice.updated)} ago />
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
