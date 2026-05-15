import React, { useEffect, useRef } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Box, Stack, List, ListItem, ListItemIcon, ListItemText, Typography, Button } from '@mui/material'
import { State, Dispatch } from '../store'
import { selectJob, selectScript } from '../selectors/scripting'
import { selectActiveAccountId } from '../selectors/accounts'
import { initialForm } from '../models/files'
import { ScriptRunSummary } from '../components/ScriptRunSummary'
import { JobStatusIcon } from '../components/JobStatusIcon'
import { JobAttribute } from '../components/JobAttributes'
import { LoadingMessage } from '../components/LoadingMessage'
import { ListItemLocation } from '../components/ListItemLocation'
import { ListItemBack } from '../components/ListItemBack'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { DeleteButton } from '../buttons/DeleteButton'
import { ColorChip } from '../components/ColorChip'
import { Timestamp } from '../components/Timestamp'
import { DataDisplay } from '../components/DataDisplay'
import { Gutters } from '../components/Gutters'
import { radius, spacing } from '../styling'

type Props = {
  showBack?: boolean
}

export const JobDetailPage: React.FC<Props> = () => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const { fileID, jobID, jobDeviceID } = useParams<{ fileID?: string; jobID: string; jobDeviceID?: string }>()

  const fallbackJob = useSelector((state: State) => selectJob(state, undefined, jobID))
  const accountId = useSelector(selectActiveAccountId)
  const scriptFileId = fileID || (fallbackJob?.file?.owner?.id === accountId ? fallbackJob.file.id : undefined)
  const script = useSelector((state: State) => scriptFileId ? selectScript(state, undefined, scriptFileId, jobID) : undefined)
  const job = script?.job || fallbackJob
  const isPrivateScript = !!job?.file?.owner?.id && job.file.owner.id !== accountId
  const isFileMissing = !job?.file?.name
  const file = isPrivateScript ? undefined : script
  const scriptFileRef = file || (!isPrivateScript ? job?.file : undefined)
  const files = useSelector((state: State) => state.files.all[accountId] || [])
  const fetching = useSelector((state: State) => state.files.fetching)
  const jobsFetching = useSelector((state: State) => state.jobs.fetching)
  const scriptName = file?.name || job?.file?.name

  // Track fetches we've already attempted so empty/missing results don't loop
  // when the fetching flag toggles back to false. Keys are scoped per-fetch
  // so a file-scoped fetch and a job-scoped fetch are tracked independently.
  const attempted = useRef<Set<string>>(new Set())

  // Reset tracked attempts when the active account changes so users who
  // switch orgs/accounts can re-attempt the same URL under the new context.
  useEffect(() => {
    attempted.current = new Set()
  }, [accountId])

  // Load jobs if not already loaded
  useEffect(() => {
    if (job) return

    // Prefer file-scoped fetch when the script is in our local cache.
    if (fileID && file) {
      const key = `file:${file.id}`
      if (fetching || jobsFetching || attempted.current.has(key)) return
      attempted.current.add(key)
      dispatch.jobs.fetchByFileIds({ fileIds: [file.id] })
      return
    }

    // Otherwise fetch the job directly. This handles guest/private scripts
    // (file never enters our cache) and direct /runs/job/:jobID links.
    if (!jobID || jobsFetching) return
    const key = `job:${jobID}`
    if (attempted.current.has(key)) return
    attempted.current.add(key)
    dispatch.jobs.fetchSingle({ jobId: jobID })
  }, [file, job, fetching, fileID, jobID, jobsFetching])

  // Ensure files are loaded for file argument display
  useEffect(() => {
    dispatch.files.fetchIfEmpty()
  }, [])

  const scriptArguments = script?.versions?.[0]?.arguments || []
  const jobDevice = job?.jobDevices.find(jd => jd.id === jobDeviceID)
  const jobDeviceAttributes =
    jobDevice?.attributes.map(
      a => new JobAttribute({ id: `attribute-${a.key}`, label: a.key, value: () => a.value, multiline: true })
    ) || []
  const isActive = job?.status === 'RUNNING' || job?.status === 'WAITING'
  const statusColor: Color =
    job?.status === 'SUCCESS'
      ? 'primary'
      : job?.status === 'FAILED' || job?.status === 'CANCELLED'
      ? 'danger'
      : job?.status === 'RUNNING'
      ? 'primary'
      : job?.status === 'WAITING'
      ? 'warning'
      : job?.status === 'READY'
      ? 'primary'
      : 'gray'

  const handleNewRun = () => {
    if (!job || !scriptFileRef) return

    const deviceIds = job.jobDevices.map(d => d.device.id)
    const tagValues = job.tag?.values || []
    const access: IRoleAccess = tagValues.length ? 'TAG' : deviceIds.length ? 'CUSTOM' : 'NONE'
    const argumentValues: IArgumentValue[] = job.arguments?.map(arg => ({ name: arg.name, value: arg.value || '' })) || []

    dispatch.ui.set({
      scriptForm: {
        ...initialForm,
        fileId: scriptFileRef.id,
        deviceIds,
        tag: job.tag ?? initialForm.tag,
        access,
        argumentValues,
      },
      selected: [],
    })

    history.push(`/script/${scriptFileRef.id}/run`)
  }

  if (!job) {
    return (
      <Container>
        {jobsFetching || fetching ? (
          <LoadingMessage />
        ) : (
          <Notice severity="warning">Job not found</Notice>
        )}
      </Container>
    )
  }

  return (
    <Container
      bodyProps={{ verticalOverflow: true, gutterBottom: true }}
      header={
        <>
          <Typography variant="h1" sx={{ alignItems: 'center' }}>
            <Box marginRight={2}>
              <JobStatusIcon status={job.status} showTooltip={false} padding={0} size="xl" />
            </Box>
            <Box sx={{ flex: 1 }}>
              {isFileMissing ? (
                <Typography component="span" variant="body2" fontStyle="italic">
                  File Deleted&nbsp;
                </Typography>
              ) : scriptFileRef ? (
                <Button
                  variant="text"
                  color="inherit"
                  sx={{ font: 'inherit', textTransform: 'none', p: 0, minWidth: 0, verticalAlign: 'baseline' }}
                  onClick={() => history.push(`/script/${scriptFileRef.id}`)}
                >
                  {scriptName}
                </Button>
              ) : (
                scriptName
              )}
              {isPrivateScript && (
                <Typography component="span" variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                  Guest script
                </Typography>
              )}
            </Box>
            <ColorChip
              label={job.status}
              size="small"
              color={statusColor}
              sx={{ textTransform: 'capitalize', mr: 1 }}
            />
            <IconButton
              icon="arrow-to-bottom"
              title="Download logs for all devices"
              size="md"
              disabled={isActive}
              onClick={async () => {
                await dispatch.jobs.downloadAllLogs({ jobId: job.id })
              }}
            />
            {scriptFileRef && (
              <DeleteButton
                title="Delete Run"
                warning="This will permanently delete this run and all its results."
                disabled={isActive}
                onDelete={async () => {
                  await dispatch.jobs.delete({ jobId: job.id, fileId: scriptFileRef.id })
                }}
              />
            )}
          </Typography>
          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ display: 'block', px: spacing.xl + 'px', pl: `calc(${spacing.xl}px + 44px)`, mt: -0.5, mb: 1.5 }}
          >
            <Timestamp date={new Date(job.created)} />
          </Typography>
          <Box sx={{ px: 4.5, pb: 2, maxHeight: 300, overflowY: 'auto' }}>
            {isActive && (
              <Button
                color="error"
                variant="contained"
                size="small"
                onClick={async () => await dispatch.jobs.cancel(job.id)}
                sx={{ my: 2 }}
              >
                Cancel Run
              </Button>
            )}
            <ScriptRunSummary
              scriptArguments={file ? scriptArguments : []}
              argumentValues={job.arguments?.map(arg => ({ name: arg.name, value: arg.value || '' }))}
              jobDevices={job.jobDevices}
              tag={job.tag}
              files={files}
              runConfigAction={scriptFileRef ? <IconButton icon="plus" title="New Run" size="md" onClick={handleNewRun} /> : undefined}
            />
          </Box>
        </>
      }
    >
      {jobDevice ? (
        <Gutters size="md" bottom={null}>
          <ListItemBack
            to={file ? `/script/${file.id}/${jobID}` : `/runs/job/${jobID}`}
            title={<Typography variant="subtitle2">DEVICE RESULTS</Typography>}
          />
          <ListItem
            dense
            disableGutters
            secondaryAction={
              <IconButton
                icon="arrow-to-bottom"
                title="Download logs for this device"
                size="md"
                disabled={jobDevice.status === 'WAITING' || jobDevice.status === 'RUNNING'}
                onClick={async () => {
                  await dispatch.jobs.downloadLogs({
                    jobId: job.id,
                    jobDeviceId: jobDevice.id,
                  })
                }}
              />
            }
          >
            <ListItemIcon>
              <JobStatusIcon status={jobDevice.status} device padding={0} size="md" />
            </ListItemIcon>
            <ListItemText primary={jobDevice.device?.name} />
          </ListItem>
          {jobDevice.updated && (
            <Typography sx={{ ml: '56px', mt: 0.25 }} gutterBottom variant="caption" component="p">
              <Timestamp date={new Date(jobDevice.updated)} />
            </Typography>
          )}
          {jobDeviceAttributes.length ? (
            <Box bgcolor="grayLightest.main" borderRadius={radius.lg + 'px'} paddingY={2} paddingX={4}>
              <DataDisplay attributes={jobDeviceAttributes} />
            </Box>
          ) : (
            <Notice fullWidth>No return values from this device</Notice>
          )}
        </Gutters>
      ) : (
        <>
          {/* Device Status Summary */}
          <Typography variant="subtitle1">
            <Title>Devices</Title>
            <Stack direction="row" spacing={0.5} marginRight={2} alignItems="center">
              <JobStatusIcon device padding={0} />
              <Typography variant="caption" sx={{ minWidth: 16 }}>
                {job.jobDevices.length || '-'}
              </Typography>
              {job.jobDevices.filter(d => d.status === 'WAITING').length > 0 && (
                <>
                  <JobStatusIcon status="WAITING" padding={0} />
                  <Typography variant="caption" sx={{ minWidth: 16 }}>
                    {job.jobDevices.filter(d => d.status === 'WAITING').length}
                  </Typography>
                </>
              )}
              {job.jobDevices.filter(d => d.status === 'RUNNING').length > 0 && (
                <>
                  <JobStatusIcon status="RUNNING" padding={0} />
                  <Typography variant="caption" sx={{ minWidth: 16 }}>
                    {job.jobDevices.filter(d => d.status === 'RUNNING').length}
                  </Typography>
                </>
              )}
              <JobStatusIcon status="SUCCESS" padding={0} />
              <Typography variant="caption" sx={{ minWidth: 16 }}>
                {job.jobDevices.filter(d => d.status === 'SUCCESS').length || '-'}
              </Typography>
              <JobStatusIcon status="FAILED" padding={0} />
              <Typography variant="caption" sx={{ minWidth: 16 }}>
                {job.jobDevices.filter(d => d.status === 'FAILED' || d.status === 'CANCELLED').length || '-'}
              </Typography>
            </Stack>
          </Typography>

          {!job.jobDevices.length ? (
            <Notice gutterTop>No devices in this run</Notice>
          ) : (
            <List>
              {job.jobDevices.map(jd => (
                <ListItemLocation
                  sx={{ paddingRight: 2 }}
                  key={jd.id}
                  to={file ? `/script/${file.id}/${jobID}/${jd.id}` : `/runs/job/${jobID}/${jd.id}`}
                  title={jd.device.name}
                  icon={<JobStatusIcon status={jd.status} device />}
                />
              ))}
            </List>
          )}
        </>
      )}
    </Container>
  )
}
