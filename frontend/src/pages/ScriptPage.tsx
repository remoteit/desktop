import React, { useEffect } from 'react'
import { VALID_JOB_ID_LENGTH, HIDE_SIDEBAR_WIDTH } from '../constants'
import { selectFile, selectJobs } from '../selectors/scripting'
import { State, Dispatch } from '../store'
import { ListItemLocation } from '../components/ListItemLocation'
import { Redirect, useParams, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Box, Stack, List, Typography, Button, useMediaQuery } from '@mui/material'
import { LinearProgress } from '../components/LinearProgress'
import { JobStatusIcon } from '../components/JobStatusIcon'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Timestamp } from '../components/Timestamp'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'
import { spacing } from '../styling'
import { ScriptDeleteButton } from '../components/ScriptDeleteButton'

export const ScriptPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const { fileID, jobID } = useParams<{ fileID?: string; jobID?: string }>()
  const file = useSelector((state: State) => selectFile(state, undefined, fileID))
  const jobs = useSelector(selectJobs).filter(j => j.file?.id === fileID)
  const fetching = useSelector((state: State) => state.files.fetching)
  const sidebarHidden = useMediaQuery(`(max-width:${HIDE_SIDEBAR_WIDTH}px)`)

  // load jobs if not already loaded
  useEffect(() => {
    if (!jobs.length && !fetching && file) dispatch.jobs.fetchByFileIds({ fileIds: [file.id] })
  }, [file])

  if (!file) return <Redirect to={{ pathname: '/scripts', state: { isRedirect: true } }} />

  return (
    <Container
      bodyProps={{ verticalOverflow: true }}
      header={
        <Box>
          <Box sx={{ height: 45, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingX: `${spacing.md}px`, marginTop: `${spacing.sm}px` }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {sidebarHidden && (
                <IconButton
                  name="bars"
                  size="md"
                  color="grayDarker"
                  onClick={() => dispatch.ui.set({ sidebarMenu: true })}
                />
              )}
              <IconButton
                icon="chevron-left"
                title="Back to Scripts"
                onClick={() => history.push('/scripts')}
                size="md"
              />
            </Box>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<Icon name="play" />}
              onClick={() => history.push(`/script/${fileID}/run`)}
            >
              Configure & Run
            </Button>
          </Box>
          <List>
            <ListItemLocation
              to={`/script/${fileID}/latest/edit`}
              match={`/script/${fileID}/latest/edit`}
              icon={<Icon name="scroll" size="lg" color="grayDark" />}
              title={
                <Stack direction="row" alignItems="center" spacing={1} sx={{ marginRight: 1 }}>
                  <Title>{file.name}</Title>
                </Stack>
              }
            >
              <ScriptDeleteButton />
            </ListItemLocation>
            {file.shortDesc && (
              <Stack flexWrap="wrap" flexDirection="row" marginLeft={9} marginRight={3}>
                <Typography variant="caption" color="grayDarker.main">
                  {file.shortDesc}
                </Typography>
              </Stack>
            )}
          </List>
          <LinearProgress loading={fetching} />
        </Box>
      }
    >
      <>
        {/* Runs List */}
        <Typography variant="subtitle1" sx={{ px: 4, pt: 3 }}>
          <Title>Run History</Title>
        </Typography>
        {!jobs.length ? (
          <Notice gutterTop>This script has not been run yet.</Notice>
        ) : (
          <List>
            {jobs.map(job => {
              const waiting = job.jobDevices.filter(d => d.status === 'WAITING').length
              const running = job.jobDevices.filter(d => d.status === 'RUNNING').length
              const success = job.jobDevices.filter(d => d.status === 'SUCCESS').length
              const failed = job.jobDevices.filter(d => d.status === 'FAILED' || d.status === 'CANCELLED').length
              
              return (
                <ListItemLocation
                  sx={{ paddingRight: 2 }}
                  key={job.id}
                  to={`/script/${fileID}/${job.id}`}
                  title={
                    <Box>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <JobStatusIcon device padding={0} size="sm" />
                        <Typography variant="body2" sx={{ minWidth: 16 }}>{job.jobDevices.length}</Typography>
                        <JobStatusIcon status="WAITING" padding={0} size="sm" />
                        <Typography variant="body2" color={waiting > 0 ? 'info.main' : 'text.secondary'} sx={{ minWidth: 16 }}>{waiting > 0 ? waiting : '-'}</Typography>
                        <JobStatusIcon status="RUNNING" padding={0} size="sm" />
                        <Typography variant="body2" color={running > 0 ? 'primary.main' : 'text.secondary'} sx={{ minWidth: 16 }}>{running > 0 ? running : '-'}</Typography>
                        <JobStatusIcon status="SUCCESS" padding={0} size="sm" />
                        <Typography variant="body2" color={success > 0 ? 'primary.main' : 'text.secondary'} sx={{ minWidth: 16 }}>{success > 0 ? success : '-'}</Typography>
                        <JobStatusIcon status="FAILED" padding={0} size="sm" />
                        <Typography variant="body2" color={failed > 0 ? 'error.main' : 'text.secondary'} sx={{ minWidth: 16 }}>{failed > 0 ? failed : '-'}</Typography>
                      </Stack>
                      {job.jobDevices[0]?.updated && (
                        <Typography variant="caption" color="text.secondary">
                          <Timestamp date={new Date(job.jobDevices[0].updated)} />
                        </Typography>
                      )}
                    </Box>
                  }
                  icon={<JobStatusIcon status={job.status} />}
                  selected={job.id === jobID}
                />
              )
            })}
          </List>
        )}
      </>
    </Container>
  )
}
