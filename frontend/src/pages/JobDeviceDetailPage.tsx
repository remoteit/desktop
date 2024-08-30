import React from 'react'
import { State } from '../store'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { JobStatusIcon } from '../components/JobStatusIcon'
import { JobAttribute } from '../components/JobAttributes'
import { selectScript } from '../selectors/scripting'
import { DataDisplay } from '../components/DataDisplay'
import { Box, Typography } from '@mui/material'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'

export const JobDeviceDetailPage: React.FC = () => {
  const { fileID, jobDeviceID } = useParams<{ fileID?: string; jobDeviceID?: string }>()
  const script = useSelector((state: State) => selectScript(state, undefined, fileID))
  const jobDevice = script?.job?.jobDevices.find(jd => jd.id === jobDeviceID)
  const attributes =
    jobDevice?.attributes.map(
      a => new JobAttribute({ id: `attribute-${a.key}`, label: a.key, value: () => a.value })
    ) || []

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <Typography variant="h1">
            <Box marginRight={2}>
              <JobStatusIcon status={jobDevice?.status} size="xl" />
            </Box>
            <Title>{jobDevice?.device?.name || 'Unknown'}</Title>
          </Typography>
          {/* {jobDevices.attributes.description && (
            <Gutters top={null}>
              <Typography variant="body2" color="textSecondary">
                {jobDevices.attributes.description}
              </Typography>
            </Gutters>
          )} */}
        </>
      }
    >
      <Gutters>
        <DataDisplay attributes={attributes} />
      </Gutters>
    </Container>
  )
}
