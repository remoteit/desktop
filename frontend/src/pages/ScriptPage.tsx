import React from 'react'
import { selectScript } from '../selectors/scripting'
import { getJobAttribute } from '../components/JobAttributes'
import { State } from '../store'
import { ListItemLocation } from '../components/ListItemLocation'
import { useSelector } from 'react-redux'
import { Redirect, useParams } from 'react-router-dom'
import { Box, Stack, List, Typography } from '@mui/material'
import { LinearProgress } from '../components/LinearProgress'
import { DevicesActionBar } from '../components/DevicesActionBar'
import { JobStatusIcon } from '../components/JobStatusIcon'
import { Container } from '../components/Container'
import { Timestamp } from '../components/Timestamp'
import { RunButton } from '../buttons/RunButton'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Pre } from '../components/Pre'

export const ScriptPage: React.FC = () => {
  const { fileID, jobID, jobDeviceID } = useParams<{ fileID?: string; jobID?: string; jobDeviceID }>()
  const script = useSelector((state: State) => selectScript(state, undefined, fileID, jobID))
  const fetching = useSelector((state: State) => state.files.fetching)

  if (!script) return <Redirect to={{ pathname: '/scripting/scripts', state: { isRedirect: true } }} />

  if (!jobDeviceID) {
    return (
      <Redirect
        to={{
          pathname: `/scripting/${script.id}/${
            script.job ? `${script.job.id}/${script.job.jobDevices[0].id}` : '-/edit'
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
          <DevicesActionBar displayOnly />
          <List>
            <ListItemLocation
              to={`/scripting/${fileID}/${script.job?.id || '-'}/edit`}
              title={<Typography variant="h2">{script.name}</Typography>}
              icon={<JobStatusIcon status={script.job?.status} device />}
              exactMatch
            />
            {script.shortDesc && (
              <Typography marginLeft={9.5} marginTop={1} marginBottom={2} variant="caption" component="p">
                {script.shortDesc}
              </Typography>
            )}
            <Box marginLeft={9} marginRight={3} marginTop={1}>
              {getJobAttribute('jobTags').value({ job: script.job })}
            </Box>
            {/* <ListItemLocation
              to={`/scripting/${fileID}/${script.job?.id || '-'}/history`}
              title="History"
              icon="clock-rotate-left"
              sx={{ marginTop: 6 }}
            /> */}
          </List>
          <Box marginLeft={9} marginY={4} marginRight={3}>
            <RunButton job={script.job} size="small" variant="contained" fullWidth />
          </Box>
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
        {script.job?.jobDevices[0].updated && (
          <Typography variant="caption" component="p" mx={4.5} my={1}>
            <Timestamp date={new Date(script.job.jobDevices[0].updated)} />
          </Typography>
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
        {(!script.job || !script.job.jobDevices.length) && (
          <Notice>No devices have been assigned to this script.</Notice>
        )}
      </>
    </Container>
  )
}
