import React, { useEffect } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Box, Stack, List, Typography, Divider, Button } from '@mui/material'
import { State, Dispatch } from '../store'
import { selectScript } from '../selectors/scripting'
import { getJobAttribute } from '../components/JobAttributes'
import { JobStatusIcon } from '../components/JobStatusIcon'
import { ListItemLocation } from '../components/ListItemLocation'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Timestamp } from '../components/Timestamp'
import { RunButton } from '../buttons/RunButton'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'
import { DeleteButton } from '../buttons/DeleteButton'

type Props = {
  showBack?: boolean
}

export const JobDetailPage: React.FC<Props> = ({ showBack }) => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const { fileID, jobID } = useParams<{ fileID: string; jobID: string }>()
  
  const script = useSelector((state: State) => selectScript(state, undefined, fileID, jobID))
  const file = script
  const job = script?.job
  const fetching = useSelector((state: State) => state.files.fetching)

  // load jobs if not already loaded
  useEffect(() => {
    if (!job && !fetching && file) {
      dispatch.jobs.fetchByFileIds({ fileIds: [file.id] })
    }
  }, [file, job, fetching])

  const handleRunWithUpdates = () => {
    // Convert job arguments to argument values format for the form
    const argumentValues: IArgumentValue[] = job.arguments?.map(arg => ({
      name: arg.name,
      value: arg.value || '',
    })) || []

    // Store the form data in UI state
    dispatch.ui.set({
      scriptForm: {
        name: file.name,
        description: file.shortDesc || '',
        executable: file.executable,
        fileId: fileID,
        jobId: job.id,
        deviceIds: job.jobDevices.map(jd => jd.device.id),
        tag: job.tag,
        access: job.tag.values.length > 0 ? 'TAG' : 'CUSTOM',
        argumentValues,
      },
    })

    // Navigate to script config page (combined edit + run panel)
    history.push(`/script/${fileID}/edit`)
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
      bodyProps={{ verticalOverflow: true }}
      header={
        <Gutters top="sm" bottom="sm">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {showBack && (
              <IconButton
                name="chevron-left"
                onClick={() => history.push(`/script/${fileID}`)}
                size="md"
                title="Back"
              />
            )}
            <Typography variant="h3" sx={{ flex: 1 }}>
              {file.name}
            </Typography>
            <DeleteButton
              title="Delete Run"
              warning="This will permanently delete this run and all its results."
              disabled={job.status === 'RUNNING' || job.status === 'WAITING'}
              onDelete={async () => {
                await dispatch.jobs.delete({ jobId: job.id, fileId: file.id })
              }}
            />
          </Box>
        </Gutters>
      }
    >
      <Box sx={{ p: 2 }}>
        {/* Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <JobStatusIcon status={job.status} size="lg" />
          <Box>
            <Typography variant="h2" textTransform="capitalize">
              {job.status.toLowerCase()}
            </Typography>
            {job.jobDevices[0]?.updated && (
              <Typography variant="caption" color="text.secondary">
                <Timestamp date={new Date(job.jobDevices[0].updated)} />
              </Typography>
            )}
          </Box>
        </Box>

        {/* Tags */}
        {!!job?.tag.values.length && (
          <Box mb={2}>
            {getJobAttribute('jobTags').value({ job })}
          </Box>
        )}

        {/* Run Buttons */}
        <Stack spacing={1} mb={3}>
          <RunButton
            job={job}
            size="small"
            onRun={async () => await dispatch.jobs.run({ jobId: job?.id, fileId: file.id })}
            onRunAgain={async () => await dispatch.jobs.runAgain({ ...file, job })}
            onCancel={async () => await dispatch.jobs.cancel(job?.id)}
            fullWidth
          />
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<Icon name="edit" />}
            onClick={handleRunWithUpdates}
            fullWidth
          >
            Prepare with Updated Selections
          </Button>
        </Stack>

        {/* Arguments */}
        {!!job.arguments?.length && (
          <>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Arguments
            </Typography>
            <List disablePadding sx={{ mb: 2 }}>
              {job.arguments.map(arg => (
                <Box key={arg.id} sx={{ mb: 1 }}>
                  <Typography variant="body2" fontWeight="bold">
                    {arg.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {arg.value || '(empty)'}
                  </Typography>
                </Box>
              ))}
            </List>
          </>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Device Status Summary */}
        <Typography variant="subtitle1">
          <Title>Devices</Title>
          <Stack direction="row" spacing={0.5} marginRight={2} alignItems="center">
            <JobStatusIcon device padding={0} />
            <Typography variant="caption" sx={{ minWidth: 16 }}>
              {job?.jobDevices.length || '-'}
            </Typography>
            <JobStatusIcon status="WAITING" padding={0} />
            <Typography variant="caption" sx={{ minWidth: 16 }}>
              {job?.jobDevices.filter(d => d.status === 'WAITING').length || '-'}
            </Typography>
            <JobStatusIcon status="RUNNING" padding={0} />
            <Typography variant="caption" sx={{ minWidth: 16 }}>
              {job?.jobDevices.filter(d => d.status === 'RUNNING').length || '-'}
            </Typography>
            <JobStatusIcon status="SUCCESS" padding={0} />
            <Typography variant="caption" sx={{ minWidth: 16 }}>
              {job?.jobDevices.filter(d => d.status === 'SUCCESS').length || '-'}
            </Typography>
            <JobStatusIcon status="FAILED" padding={0} />
            <Typography variant="caption" sx={{ minWidth: 16 }}>
              {job?.jobDevices.filter(d => d.status === 'FAILED' || d.status === 'CANCELLED').length || '-'}
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
      </Box>
    </Container>
  )
}
