import React, { useEffect } from 'react'
import { HIDE_SIDEBAR_WIDTH } from '../constants'
import { selectFile, selectJobs } from '../selectors/scripting'
import { State, Dispatch } from '../store'
import { Redirect, useParams, useHistory, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Box, Divider, Stack, Typography, useMediaQuery } from '@mui/material'
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

type Props = {
  showMenu?: boolean
}

export const ScriptPage: React.FC<Props> = ({ showMenu }) => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const location = useLocation()
  const { fileID } = useParams<{ fileID?: string }>()
  const file = useSelector((state: State) => selectFile(state, undefined, fileID))
  const jobs = useSelector(selectJobs).filter(j => j.file?.id === fileID)
  const fetching = useSelector((state: State) => state.files.fetching)
  const sidebarHidden = useMediaQuery(`(max-width:${HIDE_SIDEBAR_WIDTH}px)`)
  const recentRuns = jobs.filter(j => j.status !== 'READY').slice(0, 5)
  const latestPrepared = jobs.find(j => j.status === 'READY')

  // Determine what's currently shown in the right panel for highlighting
  const pathParts = location.pathname.split('/').filter(Boolean)
  const activeEdit = pathParts[2] === 'edit'
  const activeHistory = pathParts[2] === 'history'
  const activePrepared = pathParts[2] === 'prepared'
  const activeEditJobID = activeEdit && pathParts.length >= 4 ? pathParts[3] : undefined
  const activeJobID = pathParts.length >= 3 && !activeEdit && !activeHistory && !activePrepared ? pathParts[2] : undefined

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
          <Box
            sx={{
              height: 45,
              display: 'flex',
              alignItems: 'center',
              paddingX: `${spacing.md}px`,
              marginTop: `${spacing.sm}px`,
            }}
          >
            {showMenu && sidebarHidden && (
              <IconButton
                name="bars"
                size="md"
                color="grayDarker"
                onClick={() => dispatch.ui.set({ sidebarMenu: true })}
              />
            )}
            <IconButton icon="chevron-left" title="Back to Scripts" onClick={() => history.push('/scripts')} size="md" />
            <Box sx={{ flex: 1 }} />
            <ScriptDeleteButton />
          </Box>
          <Box
            sx={{
              mx: 2,
              py: 0.75,
              px: 1,
              cursor: 'pointer',
              borderRadius: 1,
              bgcolor: activeEdit ? 'primaryHighlight.main' : 'grayLightest.main',
              '&:hover': { bgcolor: 'primaryHighlight.main' },
            }}
            onClick={() => history.push(`/script/${fileID}/edit`)}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Icon name="scroll" size="md" color="grayDark" />
              <Typography variant="body2" fontWeight="bold">
                {file.name}
              </Typography>
            </Stack>
            {file.shortDesc && (
              <Typography variant="caption" color="grayDarker.main" sx={{ pl: 4 }}>
                {file.shortDesc}
              </Typography>
            )}
          </Box>
          <LinearProgress loading={fetching} />
        </Box>
      }
    >
      <Box sx={{ px: 2, pt: 1 }}>
        {/* Navigation links */}
        <Stack spacing={0.25}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              py: 0.75,
              px: 1,
              cursor: 'pointer',
              borderRadius: 1,
              bgcolor: activePrepared ? 'primaryHighlight.main' : undefined,
              '&:hover': { bgcolor: 'primaryHighlight.main' },
            }}
            onClick={() => history.push(`/script/${fileID}/prepared`)}
          >
            <Icon name="clipboard-check" size="md" />
            <Typography variant="body2">All Prepared</Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              py: 0.75,
              px: 1,
              cursor: 'pointer',
              borderRadius: 1,
              bgcolor: activeHistory ? 'primaryHighlight.main' : undefined,
              '&:hover': { bgcolor: 'primaryHighlight.main' },
            }}
            onClick={() => history.push(`/script/${fileID}/history`)}
          >
            <Icon name="clock-rotate-left" size="md" />
            <Typography variant="body2">Full Run History</Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        {/* ── Last Prepared ── */}
        <Typography variant="subtitle1" sx={{ px: 1, mb: 0.5 }}>
          <Title>Last Prepared</Title>
        </Typography>
        {latestPrepared ? (
          <Box
            sx={{
              cursor: 'pointer',
              borderRadius: 1,
              py: 0.75,
              px: 1,
              bgcolor: activeEditJobID === latestPrepared.id || activeJobID === latestPrepared.id ? 'primaryHighlight.main' : undefined,
              '&:hover': { bgcolor: 'primaryHighlight.main' },
            }}
            onClick={() => history.push(`/script/${fileID}/edit/${latestPrepared.id}`)}
          >
            {latestPrepared.tag?.values?.length ? (
              <Stack direction="row" spacing={0.5} sx={{ mb: 0.25 }}>
                {latestPrepared.tag.values.map(tag => (
                  <Box
                    key={tag}
                    sx={{ px: 1, py: 0.25, bgcolor: 'primaryHighlight.main', borderRadius: 0.5, display: 'inline-flex' }}
                  >
                    <Typography variant="caption" color="primary.main">
                      {tag}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            ) : null}
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" color="text.secondary">
                {latestPrepared.status.charAt(0) + latestPrepared.status.slice(1).toLowerCase()}
                {latestPrepared.jobDevices[0]?.updated && (
                  <>
                    {'  '}
                    <Timestamp date={new Date(latestPrepared.jobDevices[0].updated)} />
                  </>
                )}
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <JobStatusIcon device padding={0} size="sm" />
                <Typography variant="body2" sx={{ minWidth: 16 }}>
                  {latestPrepared.jobDevices.length}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        ) : (
          <Notice sx={{ mx: 1 }}>No prepared runs.</Notice>
        )}

        <Divider sx={{ my: 1.5 }} />

        {/* ── Last Runs ── */}
        <Typography variant="subtitle1" sx={{ px: 1, mb: 0.5 }}>
          <Title>Last Runs</Title>
        </Typography>
        {recentRuns.length ? (
          <Stack spacing={0.25}>
            {recentRuns.map(run => (
              <Box
                key={run.id}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 1,
                  py: 0.75,
                  px: 1,
                  bgcolor: activeJobID === run.id ? 'primaryHighlight.main' : undefined,
                  '&:hover': { bgcolor: 'primaryHighlight.main' },
                }}
                onClick={() => history.push(`/script/${fileID}/${run.id}`)}
              >
                {run.tag?.values?.length ? (
                  <Stack direction="row" spacing={0.5} sx={{ mb: 0.25 }}>
                    {run.tag.values.map(tag => (
                      <Box
                        key={tag}
                        sx={{ px: 1, py: 0.25, bgcolor: 'primaryHighlight.main', borderRadius: 0.5, display: 'inline-flex' }}
                      >
                        <Typography variant="caption" color="primary.main">
                          {tag}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                ) : null}
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Typography variant="caption" color="text.secondary">
                    {run.status.charAt(0) + run.status.slice(1).toLowerCase()}
                    {run.jobDevices[0]?.updated && (
                      <>
                        {'  '}
                        <Timestamp date={new Date(run.jobDevices[0].updated)} />
                      </>
                    )}
                  </Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <JobStatusIcon device padding={0} size="sm" />
                    <Typography variant="body2" sx={{ minWidth: 16 }}>
                      {run.jobDevices.length}
                    </Typography>
                    <JobStatusIcon status="WAITING" padding={0} size="sm" />
                    <Typography variant="body2" sx={{ minWidth: 16 }}>
                      {run.jobDevices.filter(d => d.status === 'WAITING').length || '-'}
                    </Typography>
                    <JobStatusIcon status="RUNNING" padding={0} size="sm" />
                    <Typography variant="body2" sx={{ minWidth: 16 }}>
                      {run.jobDevices.filter(d => d.status === 'RUNNING').length || '-'}
                    </Typography>
                    <JobStatusIcon status="SUCCESS" padding={0} size="sm" />
                    <Typography variant="body2" sx={{ minWidth: 16 }}>
                      {run.jobDevices.filter(d => d.status === 'SUCCESS').length || '-'}
                    </Typography>
                    <JobStatusIcon status="FAILED" padding={0} size="sm" />
                    <Typography variant="body2" sx={{ minWidth: 16 }}>
                      {run.jobDevices.filter(d => d.status === 'FAILED' || d.status === 'CANCELLED').length || '-'}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>
        ) : (
          <Notice sx={{ mx: 1 }}>No runs yet.</Notice>
        )}
      </Box>
    </Container>
  )
}
