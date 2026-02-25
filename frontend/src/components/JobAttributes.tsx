import React, { useRef, useState, useEffect, useCallback } from 'react'
import { toLookup } from '../helpers/utilHelper'
import { Box, Chip, Typography } from '@mui/material'
import { ReactiveTagNames } from './ReactiveTagNames'
import { JobStatusIcon } from './JobStatusIcon'
import { Attribute } from './Attributes'
import { Duration } from './Duration'
import { Icon } from './Icon'

const MAX_ROWS = 2

const DeviceNameChips: React.FC<{ names: string[] }> = ({ names }) => {
  const measureRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(names.length)

  const measure = useCallback(() => {
    const container = measureRef.current
    if (!container) return
    const children = Array.from(container.children) as HTMLElement[]
    if (!children.length) return

    // Count how many chips fit in MAX_ROWS by tracking distinct offsetTop values
    const rows: number[] = []
    let fitsCount = 0
    let lastFitRight = 0
    for (const child of children) {
      const top = child.offsetTop
      if (!rows.includes(top)) rows.push(top)
      if (rows.length > MAX_ROWS) break
      fitsCount++
      lastFitRight = child.offsetLeft + child.offsetWidth
    }

    const containerWidth = container.offsetWidth

    if (fitsCount >= names.length) {
      setVisibleCount(fitsCount) // All fit, no "+N" needed
    } else {
      // Check if "+N" text (~35px) fits on the same row as the last chip
      const spaceLeft = containerWidth - lastFitRight
      const needsDrop = spaceLeft < 40 // ~35px for "+N" text + gap
      setVisibleCount(needsDrop ? Math.max(fitsCount - 1, 1) : fitsCount)
    }
  }, [names])

  useEffect(() => {
    requestAnimationFrame(() => measure())

    // Observe the grid cell for width changes, not our own container (avoids resize loop)
    const attributeCell = measureRef.current?.closest('.attribute')
    if (!attributeCell) return

    const observer = new ResizeObserver(() => measure())
    observer.observe(attributeCell)
    return () => observer.disconnect()
  }, [names, measure])

  const remaining = names.length - visibleCount

  return (
    <Box sx={{ width: '100%', whiteSpace: 'normal', overflow: 'visible' }}>
      {/* Always-rendered measurement container — all chips visible for accurate layout */}
      <Box
        ref={measureRef}
        aria-hidden
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.5,
          position: 'relative', // Makes this the offsetParent so child.offsetLeft is relative to here
          visibility: 'hidden',
          height: 0,
          overflow: 'hidden',
        }}
      >
        {names.map((name, i) => (
          <Chip key={i} label={name} size="small" variant="outlined" sx={{ maxWidth: 120 }} />
        ))}
      </Box>
      {/* Visible display — only shows chips that fit */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
        {names.slice(0, visibleCount).map((name, i) => (
          <Chip key={i} label={name} size="small" variant="outlined" sx={{ maxWidth: 120 }} />
        ))}
        {remaining > 0 && (
          <Typography variant="caption" color="primary" sx={{ whiteSpace: 'nowrap' }}>
            +{remaining}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export class JobAttribute extends Attribute {
  type: Attribute['type'] = 'SCRIPT'
}

export const jobAttributes: JobAttribute[] = [
  new JobAttribute({
    id: 'jobName',
    label: 'Name',
    required: true,
    defaultWidth: 350,
    value: ({ job }) =>
      job?.file?.name ? (
        <Typography>{job.file.name}</Typography>
      ) : (
        <Typography variant="body2" fontStyle="italic">
          File Deleted&nbsp;
        </Typography>
      ),
  }),
  new JobAttribute({
    id: 'jobDeviceCount',
    label: <Icon name="router" size="sm" />,
    align: 'center',
    defaultWidth: 60,
    value: ({ job }) => (
      <Typography variant="body2" color="gray.main">
        {job?.jobDevices.length || '-'}
      </Typography>
    ),
  }),
  new JobAttribute({
    id: 'jobDeviceNames',
    label: 'Targets',
    defaultWidth: 200,
    value: ({ job }) => {
      const names = job?.jobDevices.map(jd => jd.device.name) || []
      if (!names.length) return <Typography variant="body2" color="gray.main">-</Typography>
      return <DeviceNameChips names={names} />
    },
  }),
  new JobAttribute({
    id: 'jobDeviceWaiting',
    label: <JobStatusIcon status="WAITING" padding={0} />,
    align: 'center',
    defaultWidth: 50,
    value: ({ job }) => (
      <Typography variant="body2" color="info.main">
        {job?.jobDevices.filter(d => d.status === 'WAITING').length || '-'}
      </Typography>
    ),
  }),
  new JobAttribute({
    id: 'jobDeviceRunning',
    label: <JobStatusIcon status="RUNNING" padding={0} />,
    align: 'center',
    defaultWidth: 50,
    value: ({ job }) => (
      <Typography variant="body2" color="primary">
        {job?.jobDevices.filter(d => d.status === 'RUNNING').length || '-'}
      </Typography>
    ),
  }),
  new JobAttribute({
    id: 'jobDeviceSuccess',
    label: <JobStatusIcon status="SUCCESS" padding={0} />,
    align: 'center',
    defaultWidth: 50,
    value: ({ job }) => (
      <Typography variant="body2" color="primary">
        {job?.jobDevices.filter(d => d.status === 'SUCCESS').length || '-'}
      </Typography>
    ),
  }),
  new JobAttribute({
    id: 'jobDeviceFailure',
    label: <JobStatusIcon status="FAILED" padding={0} />,
    align: 'center',
    defaultWidth: 50,
    value: ({ job }) => (
      <Typography variant="body2" color="error">
        {job?.jobDevices.filter(d => d.status === 'FAILED' || d.status === 'CANCELLED').length || '-'}
      </Typography>
    ),
  }),
  new JobAttribute({
    id: 'jobUpdated',
    label: 'Time',
    defaultWidth: 160,
    value: ({ job }) =>
      job?.updated && (
        <Typography variant="caption" color="grayDarkest.main">
          <Duration startDate={new Date(job.updated)} humanizeOptions={{ largest: 1 }} ago />
        </Typography>
      ),
  }),
  new JobAttribute({
    id: 'jobTags',
    label: 'Filter',
    defaultWidth: 100,
    value: ({ job }) =>
      job?.tag.values.length ? <ReactiveTagNames tags={job.tag.values} /> : <Chip label="None" size="small" />,
  }),
  new JobAttribute({
    id: 'jobMatches',
    label: 'Match',
    defaultWidth: 100,
    value: ({ job }) => <Chip label={job?.tag.operator} size="small" />,
  }),
  new JobAttribute({
    id: 'jobRunBy',
    label: 'Run By',
    defaultWidth: 150,
    value: ({ job }) => (
      <Typography variant="body2" color="grayDarkest.main" noWrap>
        {job?.user?.email || job?.owner?.email || '-'}
      </Typography>
    ),
  }),
]

const attributeLookup = toLookup<Attribute>(jobAttributes, 'id')

export function getJobAttribute(id: string): JobAttribute {
  return attributeLookup[id] || new JobAttribute({ id: 'unknown', label: 'Unknown' })
}
