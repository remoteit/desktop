import React from 'react'
import { selectScript } from '../selectors/scripting'
import { getJobAttribute } from '../components/JobAttributes'
import { Dispatch, State } from '../store'
import { ListItemLocation } from '../components/ListItemLocation'
import { useDispatch, useSelector } from 'react-redux'
import { Redirect, useParams } from 'react-router-dom'
import { Box, Stack, List, Typography } from '@mui/material'
import { LinearProgress } from '../components/LinearProgress'
import { JobStatusIcon } from '../components/JobStatusIcon'
import { Container } from '../components/Container'
import { Duration } from '../components/Duration'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Pre } from '../components/Pre'

export const ScriptPage: React.FC = () => {
  const { fileID, jobID, jobDeviceID } = useParams<{ fileID?: string; jobID?: string; jobDeviceID }>()
  const script = useSelector((state: State) => selectScript(state, undefined, fileID, jobID))
  const fetching = useSelector((state: State) => state.files.fetching)
  // const dispatch = useDispatch<Dispatch>()
  // const location = useLocation()
  // const history = useHistory()

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
          <List>
            <ListItemLocation
              to={`/scripting/${fileID}/${script.job?.id || '-'}/edit`}
              title={<Typography variant="h2">{script.name}</Typography>}
              icon="scripting"
              exactMatch
            />
            <Box marginLeft={9} marginRight={3}>
              {getJobAttribute('jobTags').value({ job: script.job })}
            </Box>
            {script.shortDesc && (
              <Typography marginLeft={9.5} marginTop={4} marginBottom={2} variant="caption" component="p">
                {script.shortDesc}
              </Typography>
            )}
            {/* <ListItemLocation
              to={`/scripting/${fileID}/${script.job?.id || '-'}/history`}
              title="History"
              icon="clock-rotate-left"
              sx={{ marginTop: 4 }}
            /> */}
          </List>
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
            <JobStatusIcon />
            <Typography variant="caption" paddingLeft={2}>
              {script.job?.jobDevices.filter(d => d.status === 'SUCCESS').length || '-'}
            </Typography>
            <JobStatusIcon status="SUCCESS" />
            <Typography variant="caption" paddingLeft={2}>
              {script.job?.jobDevices.filter(d => d.status === 'FAILED' || d.status === 'CANCELLED').length || '-'}
            </Typography>
            <JobStatusIcon status="FAILED" />
          </Stack>
        </Typography>
        <List>
          {script.job?.jobDevices.map(jd => (
            <ListItemLocation
              key={jd.id}
              to={`/scripting/${fileID}/${script.job?.id || '-'}/${jd.id}`}
              title={jd.device.name}
              icon={<JobStatusIcon status={jd.status} />}
            >
              <Typography variant="caption" marginRight={2}>
                <Duration startDate={new Date(jd.updated)} humanizeOptions={{ largest: 1 }} ago />
              </Typography>
            </ListItemLocation>
          ))}
        </List>
        {(!script.job || !script.job.jobDevices.length) && (
          <Notice>No devices have been assigned to this script.</Notice>
        )}
      </>
    </Container>
  )
}
