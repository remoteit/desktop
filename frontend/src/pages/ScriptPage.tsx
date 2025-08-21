import React, { useEffect } from 'react'
import { VALID_JOB_ID_LENGTH } from '../constants'
import { selectFile, selectJobs } from '../selectors/scripting'
import { State, Dispatch } from '../store'
import { getJobAttribute } from '../components/JobAttributes'
import { ListItemLocation } from '../components/ListItemLocation'
import { Redirect, useParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Box, Stack, List, Typography } from '@mui/material'
import { ScriptDeleteButton } from '../components/ScriptDeleteButton'
import { LinearProgress } from '../components/LinearProgress'
import { JobStatusIcon } from '../components/JobStatusIcon'
import { Container } from '../components/Container'
import { Timestamp } from '../components/Timestamp'
import { RunButton } from '../buttons/RunButton'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'
// import { Pre } from '../components/Pre'

export const ScriptPage: React.FC<{ layout: ILayout }> = ({ layout }) => {
  const dispatch = useDispatch<Dispatch>()
  const { fileID, jobID, jobDeviceID } = useParams<{ fileID?: string; jobID?: string; jobDeviceID?: string }>()
  const file = useSelector((state: State) => selectFile(state, undefined, fileID))
  const jobs = useSelector(selectJobs).filter(j => j.file?.id === fileID)
  const job: IJob | undefined = jobs.find(j => j.id === jobID) || jobs[0]
  const fetching = useSelector((state: State) => state.files.fetching)
  const noDevices = !job || !job?.jobDevices.length
  const validJobID = jobID && jobID.length >= VALID_JOB_ID_LENGTH

  // load jobs if not already loaded
  useEffect(() => {
    if (!jobs.length && !fetching && file) dispatch.jobs.fetchByFileIds({ fileIds: [file.id] })
  }, [file])

  if (!file) return <Redirect to={{ pathname: '/scripts', state: { isRedirect: true } }} />

  if (
    !layout.singlePanel &&
    jobDeviceID !== 'edit' &&
    (!jobDeviceID || (jobID === 'latest' && !job?.jobDevices.some(jd => jd.id === jobDeviceID)))
  ) {
    return (
      <Redirect
        to={{
          pathname: `/script/${file.id}/${validJobID ? jobID : 'latest'}/${noDevices ? 'edit' : job?.jobDevices[0].id}`,
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
              to={`/script/${fileID}/${jobID}/edit`}
              title={<Typography variant="h2">{file.name}</Typography>}
              icon={<JobStatusIcon status={job?.status} size="lg" />}
              exactMatch
            >
              <Box marginRight={2}>
                <Icon name="chevron-right" color="grayDark" className="hidden" />
              </Box>
            </ListItemLocation>
          </List>
          <Gutters inset="icon" bottom="lg" top={null}>
            {!!job?.tag.values.length && <Box marginBottom={2}>{getJobAttribute('jobTags').value({ job })}</Box>}
            {job?.jobDevices[0]?.updated && (
              <Typography variant="caption" color="GrayText" marginTop={1} textTransform="capitalize" component="p">
                {job?.status.toLowerCase()} &nbsp;
                <Timestamp date={new Date(job?.jobDevices[0].updated)} />
              </Typography>
            )}
            {file.shortDesc && (
              <Typography color="grayDarkest.main" variant="caption" component="p" marginTop={1}>
                {file.shortDesc}
              </Typography>
            )}
          </Gutters>
          <List>
            <ListItemLocation title="Run History" to={`/runs/${fileID}`} icon="clock-rotate-left" />
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
              {job?.jobDevices.length || '-'}
            </Typography>
            <JobStatusIcon device padding={0} />
            <Typography variant="caption" paddingLeft={2}>
              {job?.jobDevices.filter(d => d.status === 'SUCCESS').length || '-'}
            </Typography>
            <JobStatusIcon status="SUCCESS" padding={0} />
            <Typography variant="caption" paddingLeft={2}>
              {job?.jobDevices.filter(d => d.status === 'FAILED' || d.status === 'CANCELLED').length || '-'}
            </Typography>
            <JobStatusIcon status="FAILED" padding={0} />
          </Stack>
        </Typography>
        {noDevices ? (
          <Notice gutterTop>This script has not been run yet.</Notice>
        ) : (
          <Box marginY={3} marginX={4}>
            <RunButton
              job={job}
              size="small"
              onRun={async () => await dispatch.jobs.run({ jobId: job?.id, fileId: file.id })}
              onRunAgain={async () => await dispatch.jobs.runAgain({ ...file, job })}
              onCancel={async () => await dispatch.jobs.cancel(job?.id)}
              fullWidth
            />
          </Box>
        )}
        <List>
          {job?.jobDevices.map(jd => (
            <ListItemLocation
              sx={{ paddingRight: 2 }}
              key={jd.id}
              to={`/script/${fileID}/${validJobID ? jobID : 'latest'}/${jd.id}`}
              title={jd.device.name}
              icon={<JobStatusIcon status={jd.status} device />}
            />
          ))}
        </List>
      </>
    </Container>
  )
}
