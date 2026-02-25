import React, { useEffect } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Box, Stack, List, Typography, Button } from '@mui/material'
import { State, Dispatch } from '../store'
import { selectScript } from '../selectors/scripting'
import { selectActiveAccountId } from '../selectors/accounts'
import { initialForm } from '../models/files'
import { ScriptRunSummary } from '../components/ScriptRunSummary'
import { JobStatusIcon } from '../components/JobStatusIcon'
import { JobAttribute } from '../components/JobAttributes'
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
  const { fileID, jobID, jobDeviceID } = useParams<{ fileID: string; jobID: string; jobDeviceID?: string }>()

  const script = useSelector((state: State) => selectScript(state, undefined, fileID, jobID))
  const accountId = useSelector(selectActiveAccountId)
  const file = script
  const job = script?.job
  const files = useSelector((state: State) => state.files.all[accountId] || [])
  const fetching = useSelector((state: State) => state.files.fetching)

  // Load jobs if not already loaded
  useEffect(() => {
    if (!job && !fetching && file) dispatch.jobs.fetchByFileIds({ fileIds: [file.id] })
  }, [file, job, fetching])

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
    if (!job) return

    const deviceIds = job.jobDevices.map(d => d.device.id)
    const tagValues = job.tag?.values || []
    const access: IRoleAccess = tagValues.length ? 'TAG' : deviceIds.length ? 'CUSTOM' : 'NONE'
    const argumentValues: IArgumentValue[] = job.arguments?.map(arg => ({ name: arg.name, value: arg.value || '' })) || []

    dispatch.ui.set({
      scriptForm: {
        ...initialForm,
        fileId,
        deviceIds,
        tag: job.tag ?? initialForm.tag,
        access,
        argumentValues,
      },
      selected: [],
    })

    history.push(`/script/${fileID}/run`)
  }

  if (!file || !job) {
    return (
      <Container>
        <Notice severity="warning">Job not found</Notice>
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
              <JobStatusIcon status={job.status} title={false} padding={0} size="xl" />
            </Box>
            <Box sx={{ flex: 1 }}>{file.name}</Box>
            <ColorChip
              label={job.status}
              size="small"
              color={statusColor}
              sx={{ textTransform: 'capitalize', mr: 1 }}
            />
            <DeleteButton
              title="Delete Run"
              warning="This will permanently delete this run and all its results."
              disabled={isActive}
              onDelete={async () => {
                await dispatch.jobs.delete({ jobId: job.id, fileId: file.id })
              }}
            />
          </Typography>
          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ display: 'block', px: spacing.xl + 'px', pl: `calc(${spacing.xl}px + 44px)`, mt: -0.5, mb: 1.5 }}
          >
            <Timestamp date={new Date(job.created)} />
          </Typography>
          <Box sx={{ px: spacing.xl + 'px', pb: 2, maxHeight: 300, overflowY: 'auto' }}>
            {isActive && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                fullWidth
                sx={{ mb: 2 }}
                onClick={async () => await dispatch.jobs.cancel(job.id)}
              >
                Cancel Run
              </Button>
            )}
            <ScriptRunSummary
              scriptArguments={scriptArguments}
              argumentValues={job.arguments?.map(arg => ({ name: arg.name, value: arg.value || '' }))}
              jobDevices={job.jobDevices}
              tag={job.tag}
              files={files}
              runConfigAction={<IconButton icon="plus" title="New Run" size="md" onClick={handleNewRun} />}
            />
          </Box>
        </>
      }
    >
      {jobDevice ? (
        <Gutters size="md" bottom={null}>
          <ListItemBack
            to={`/script/${fileID}/${jobID}`}
            title={<Typography variant="subtitle2">DEVICE RESULTS</Typography>}
          />
          <ListItemLocation
            title={jobDevice.device?.name}
            icon={<JobStatusIcon status={jobDevice.status} device padding={0} size="md" />}
            dense
            disableGutters
          />
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
                  to={`/script/${fileID}/${jobID}/${jd.id}`}
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
