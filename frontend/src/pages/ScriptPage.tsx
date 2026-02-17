import React, { useEffect } from 'react'
import { selectFile, selectJobs } from '../selectors/scripting'
import { State, Dispatch } from '../store'
import { Redirect, useParams, useHistory, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Box, List, Typography } from '@mui/material'
import { JobAttribute, jobAttributes } from '../components/JobAttributes'
import { toLookup } from '../helpers/utilHelper'
import { LinearProgress } from '../components/LinearProgress'
import { ListItemLocation } from '../components/ListItemLocation'
import { IconButton } from '../buttons/IconButton'
import { StickyTitle } from '../components/StickyTitle'
import { Container } from '../components/Container'
import { JobList } from '../components/JobList'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
type Props = {}

// Required/sticky column for Complete section only
const requiredResult = new JobAttribute({ id: 'historyIcon', label: 'Result', defaultWidth: 20, value: () => null, align: 'center' })

// Build per-section attribute lists with unique IDs so column widths are independent
const attrLookup = toLookup<JobAttribute>(jobAttributes, 'id')

// Clone an attribute with a section-specific ID (so width is stored/read independently)
function sectionAttr(attr: JobAttribute, section: string): JobAttribute {
  return new JobAttribute({
    id: `${attr.id}_${section}`,
    label: attr.label,
    defaultWidth: attr.defaultWidth,
    align: attr.align,
    value: attr.value,
  })
}

function sectionAttrs(attrs: JobAttribute[], section: string): JobAttribute[] {
  return attrs.map(a => sectionAttr(a, section))
}

// Prepared: devices, targets, filter, match, run by
const preparedAttrs = sectionAttrs(
  [attrLookup.jobDeviceCount, attrLookup.jobDeviceNames, attrLookup.jobTags, attrLookup.jobMatches, attrLookup.jobRunBy].filter(Boolean),
  'prepared'
)

// Running: devices, targets, waiting, running, success, failed, time, run by
const runningAttrs = sectionAttrs(
  [attrLookup.jobDeviceCount, attrLookup.jobDeviceNames, attrLookup.jobDeviceWaiting, attrLookup.jobDeviceRunning, attrLookup.jobDeviceSuccess, attrLookup.jobDeviceFailure, attrLookup.jobUpdated, attrLookup.jobRunBy].filter(Boolean),
  'running'
)

// Complete: devices, targets, success, failed, time, run by
const completeAttrs = sectionAttrs(
  [attrLookup.jobDeviceCount, attrLookup.jobDeviceNames, attrLookup.jobDeviceSuccess, attrLookup.jobDeviceFailure, attrLookup.jobUpdated, attrLookup.jobRunBy].filter(Boolean),
  'complete'
)

export const ScriptPage: React.FC<Props> = () => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const location = useLocation()
  const { fileID } = useParams<{ fileID?: string }>()
  const file = useSelector((state: State) => selectFile(state, undefined, fileID))
  const jobs = useSelector(selectJobs).filter(j => j.file?.id === fileID)
  const fetching = useSelector((state: State) => state.files.fetching)
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)


  // Filter jobs into three sections
  const preparedJobs = jobs.filter(j => j.status === 'READY')
  const runningJobs = jobs.filter(j => j.status === 'RUNNING' || j.status === 'WAITING')
  const completeJobs = jobs.filter(j => j.status === 'SUCCESS' || j.status === 'FAILED' || j.status === 'CANCELLED')

  // Determine what's currently shown in the right panel for highlighting
  const pathParts = location.pathname.split('/').filter(Boolean)
  // Extract active job ID: /script/:fileID/edit/:jobID or /script/:fileID/:jobID
  const activeJobId = pathParts[2] === 'edit' ? pathParts[3] : pathParts[2]
  // load jobs if not already loaded
  useEffect(() => {
    if (!jobs.length && !fetching && file) dispatch.jobs.fetchByFileIds({ fileIds: [file.id] })
  }, [file])

  if (!file) return <Redirect to={{ pathname: '/scripts', state: { isRedirect: true } }} />

  return (
    <Container
      bodyProps={{ verticalOverflow: true, horizontalOverflow: true }}
      header={
        <>
          <List sx={{ marginBottom: 0 }}>
            <ListItemLocation
              to={`/script/${fileID}/edit`}
              title={<Typography variant="h2">{file.name}</Typography>}
              subtitle={file.shortDesc}
              icon="scroll"
              exactMatch
            />
          </List>
          <LinearProgress loading={fetching} />
        </>
      }
    >
      <Box>
        {/* ── Prepared ── */}
        <StickyTitle>
          <Title>Prepared</Title>
          <Box sx={{ flex: 1 }} />
          <IconButton
            icon="plus"
            title="New Run"
            size="md"
            onClick={() => {
              dispatch.ui.accordion({ [`scriptRun-${fileID}`]: true })
              history.push(`/script/${fileID}/edit`)
            }}
          />
        </StickyTitle>
        {preparedJobs.length ? (
          <JobList attributes={preparedAttrs} jobs={preparedJobs} columnWidths={columnWidths} fetching={fetching} activeJobId={activeJobId} />
        ) : (
          <Notice sx={{ mx: 2 }}>No prepared runs.</Notice>
        )}

        {/* ── Running ── */}
        <StickyTitle>
          <Title>Running</Title>
        </StickyTitle>
        {runningJobs.length ? (
          <JobList attributes={runningAttrs} jobs={runningJobs} columnWidths={columnWidths} fetching={fetching} activeJobId={activeJobId} />
        ) : (
          <Notice sx={{ mx: 2 }}>No running jobs.</Notice>
        )}

        {/* ── Complete ── */}
        <StickyTitle>
          <Title>Complete</Title>
        </StickyTitle>
        {completeJobs.length ? (
          <JobList attributes={completeAttrs} required={requiredResult} jobs={completeJobs} columnWidths={columnWidths} fetching={fetching} activeJobId={activeJobId} />
        ) : (
          <Notice sx={{ mx: 2 }}>No completed runs.</Notice>
        )}
      </Box>
    </Container>
  )
}
