import React from 'react'
import { State } from '../store'
import { useSelector } from 'react-redux'
import { selectScript } from '../selectors/scripting'
import { getJobAttribute } from '../components/JobAttributes'
import { ListItemLocation } from '../components/ListItemLocation'
import { Redirect, useParams } from 'react-router-dom'
import { Box, Stack, List, Typography } from '@mui/material'
import { LinearProgress } from '../components/LinearProgress'
import { JobStatusIcon } from '../components/JobStatusIcon'
import { Container } from '../components/Container'
import { Timestamp } from '../components/Timestamp'
import { RunButton } from '../buttons/RunButton'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
// import { Pre } from '../components/Pre'

export const ScriptPage: React.FC = () => {
  const { fileID, jobID, jobDeviceID } = useParams<{ fileID?: string; jobID?: string; jobDeviceID?: string }>()
  const script = useSelector((state: State) => selectScript(state, undefined, fileID, jobID))
  const fetching = useSelector((state: State) => state.files.fetching)

  if (!script) return <Redirect to={{ pathname: '/scripting/scripts', state: { isRedirect: true } }} />

  const noDevices = !script?.job || !script.job.jobDevices.length
  const hasRun = script.job && script.job.status !== 'READY'

  if (!jobDeviceID) {
    return (
      <Redirect
        to={{
          pathname: `/scripting/${script.id}/${
            hasRun ? `${script.job?.id}/${script.job?.jobDevices[0]?.id}` : '-/edit'
          }`,
          state: { isRedirect: true },
        }}
      />
    )
  }

  return (
    <Container
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <List sx={{ marginBottom: 0 }}>
            <ListItemLocation
              to={`/scripting/${fileID}/${hasRun ? script.job?.id : '-'}/edit`}
              title={<Typography variant="h2">{script.name}</Typography>}
              icon={<JobStatusIcon status={script.job?.status} size="lg" />}
              exactMatch
            />
            {/* <ListItemLocation
              to={`/scripting/${fileID}/${script.job?.id || '-'}/history`}
              title="History"
              icon="clock-rotate-left"
              sx={{ marginTop: 6 }}
            /> */}
          </List>
          <Gutters inset="icon" bottom="xl" top={null}>
            {getJobAttribute('jobTags').value({ job: script.job })}
            {script.shortDesc && (
              <Typography variant="caption" marginTop={1} component="p">
                {script.shortDesc}
              </Typography>
            )}
            {script.job?.jobDevices[0]?.updated && (
              <Typography variant="caption" color="GrayText" marginTop={6} textTransform="capitalize" component="p">
                {script.job?.status.toLowerCase()} &nbsp;
                <Timestamp date={new Date(script.job.jobDevices[0].updated)} />
              </Typography>
            )}
          </Gutters>
          <LinearProgress loading={fetching} />
        </>
      }
    >
      <>
        <Typography variant="subtitle1">
          <Title>Devices</Title>
          <Stack direction="row" spacing={1} marginRight={2}>
            <Typography variant="caption" paddingLeft={2}>
              {script.job?.jobDevices.length || '-'}
            </Typography>
            <JobStatusIcon device padding={0} />
            <Typography variant="caption" paddingLeft={2}>
              {script.job?.jobDevices.filter(d => d.status === 'SUCCESS').length || '-'}
            </Typography>
            <JobStatusIcon status="SUCCESS" padding={0} />
            <Typography variant="caption" paddingLeft={2}>
              {script.job?.jobDevices.filter(d => d.status === 'FAILED' || d.status === 'CANCELLED').length || '-'}
            </Typography>
            <JobStatusIcon status="FAILED" padding={0} />
          </Stack>
        </Typography>
        {noDevices ? (
          <Notice gutterTop>This script has not been run yet.</Notice>
        ) : (
          <Box marginY={3} marginX={4}>
            <RunButton job={script.job} size="small" fullWidth />
          </Box>
        )}
        <List>
          {script.job?.jobDevices.map(jd => (
            <ListItemLocation
              sx={{ paddingRight: 2 }}
              key={jd.id}
              to={`/scripting/${fileID}/${script.job?.id || '-'}/${jd.id}`}
              title={jd.device.name}
              icon={<JobStatusIcon status={jd.status} device />}
            />
          ))}
        </List>
      </>
    </Container>
  )
}
