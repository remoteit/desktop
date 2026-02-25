import React, { useEffect } from 'react'
import { selectFile, selectJobs } from '../selectors/scripting'
import { State, Dispatch } from '../store'
import { Redirect, useParams, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { List, ListItemText, Typography, Chip } from '@mui/material'
import { LinearProgress } from '../components/LinearProgress'
import { ListItemLocation } from '../components/ListItemLocation'
import { JobStatusIcon } from '../components/JobStatusIcon'
import { ReactiveTagNames } from '../components/ReactiveTagNames'
import { Duration } from '../components/Duration'
import { Container } from '../components/Container'
import { IconButton } from '../buttons/IconButton'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'

const MAX_RUNS = 12

export const ScriptPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const { fileID } = useParams<{ fileID?: string }>()
  const file = useSelector((state: State) => selectFile(state, undefined, fileID))
  const jobs = useSelector(selectJobs).filter(j => j.file?.id === fileID)
  const fetching = useSelector((state: State) => state.files.fetching)

  // Load jobs if not already loaded
  useEffect(() => {
    if (!jobs.length && !fetching && file) dispatch.jobs.fetchByFileIds({ fileIds: [file.id] })
  }, [file])

  if (!file) return <Redirect to={{ pathname: '/scripts', state: { isRedirect: true } }} />

  // Split jobs into groups
  const readyJobs = jobs.filter(j => j.status === 'READY')
  const runningJobs = jobs.filter(j => j.status === 'RUNNING' || j.status === 'WAITING')
  const completedJobs = [...jobs]
    .filter(j => j.status === 'SUCCESS' || j.status === 'FAILED' || j.status === 'CANCELLED')
    .sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime())
    .slice(0, MAX_RUNS)

  const args = file.versions?.[0]?.arguments

  const renderJobRow = (job: IJob) => {
    const deviceCount = job.jobDevices.length
    const deviceLabel =
      deviceCount === 1 ? job.jobDevices[0].device.name : deviceCount === 0 ? 'No devices' : `${deviceCount} devices`
    const tagNames = job.tag?.values || []
    const to = job.status === 'READY' ? `/script/${file.id}/run/${job.id}` : `/script/${file.id}/${job.id}`
    const matchPath = job.status === 'READY' ? `/script/${file.id}/run/${job.id}` : `/script/${file.id}/${job.id}`

    return (
      <ListItemLocation
        dense
        key={job.id}
        to={to}
        match={matchPath}
        icon={<JobStatusIcon status={job.status} padding={0.5} />}
        title={deviceLabel}
      >
        {tagNames.length > 0 && <ReactiveTagNames tags={tagNames} small max={1} />}
        <Typography variant="caption" color="grayDarkest.main" noWrap sx={{ flexShrink: 0, ml: 0.5, mr: 2 }}>
          <Duration startDate={new Date(job.updated)} humanizeOptions={{ largest: 1 }} tiered ago />
        </Typography>
      </ListItemLocation>
    )
  }

  return (
    <Container
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <List disablePadding>
            <ListItemLocation
              to={`/script/${fileID}/edit`}
              title={<Typography variant="h2">{file.name}</Typography>}
              icon="scroll"
              exactMatch
            />
          </List>
          {/* ── Script Details ── */}
          {file.shortDesc && (
            <Gutters top={null} inset="xl" sx={{ marginLeft: 5 }}>
              <Typography variant="caption" component="p">
                {file.shortDesc}
              </Typography>
            </Gutters>
          )}
          <List disablePadding sx={{ marginBottom: 2 }}>
            {args && args.length > 0 && (
              <ListItemLocation
                dense
                icon="sliders"
                iconTooltip="Arguments"
                title={args.map(arg => (
                  <Chip key={arg.name} label={arg.name} size="small" variant="outlined" />
                ))}
              />
            )}
            <ListItemLocation
              icon="calendar"
              iconTooltip="Timestamps"
              subtitle={
                <>
                  Created <Duration startDate={new Date(file.created)} humanizeOptions={{ largest: 1 }} ago />
                  <br />
                  Updated <Duration startDate={new Date(file.updated)} humanizeOptions={{ largest: 1 }} ago />
                </>
              }
            ></ListItemLocation>
          </List>
          <LinearProgress loading={fetching} />
        </>
      }
    >
      {/* ── Ready ── */}
      {readyJobs.length > 0 && (
        <>
          <Typography variant="subtitle1">
            <Title>Ready</Title>
            <IconButton icon="plus" title="New Run" size="md" onClick={() => history.push(`/script/${fileID}/run`)} />
          </Typography>
          <List>{readyJobs.map(renderJobRow)}</List>
        </>
      )}

      {/* ── Running ── */}
      {runningJobs.length > 0 && (
        <>
          <Typography variant="subtitle1">
            <Title>Running</Title>
          </Typography>
          <List>{runningJobs.map(renderJobRow)}</List>
        </>
      )}

      {/* ── Runs ── */}
      <Typography variant="subtitle1">
        <Title>Runs</Title>
        {!readyJobs.length && (
          <IconButton
            icon="plus"
            title="New Run"
            size="md"
            onClick={() => {
              history.push(`/script/${fileID}/run`)
            }}
          />
        )}
      </Typography>
      {completedJobs.length ? (
        <List>{completedJobs.map(renderJobRow)}</List>
      ) : (
        <Notice sx={{ mx: 2 }}>No runs yet.</Notice>
      )}
    </Container>
  )
}
