import React from 'react'
import { toLookup } from '../helpers/utilHelper'
import { Chip, Typography } from '@mui/material'
import { ReactiveTagNames } from './ReactiveTagNames'
import { JobStatusIcon } from './JobStatusIcon'
import { Attribute } from './Attributes'
import { Duration } from './Duration'

export class JobAttribute extends Attribute {
  type: Attribute['type'] = 'SCRIPT'
}

export const jobAttributes: JobAttribute[] = [
  new JobAttribute({
    id: 'jobName',
    label: 'Name',
    required: true,
    defaultWidth: 300,
    value: ({ job }) =>
      job?.file?.name ? (
        <Typography>{job.file.name}</Typography>
      ) : (
        <Typography variant="body2" color="gray.main" fontStyle="italic">
          File Deleted&nbsp;
        </Typography>
      ),
  }),
  new JobAttribute({
    id: 'jobDeviceCount',
    label: <JobStatusIcon />,
    defaultWidth: 50,
    value: ({ job }) => (
      <Typography variant="body2" color="gray.main">
        {job?.jobDevices.length || '-'}
      </Typography>
    ),
  }),
  new JobAttribute({
    id: 'jobDeviceSuccess',
    label: <JobStatusIcon status="SUCCESS" />,
    defaultWidth: 50,
    value: ({ job }) => (
      <Typography variant="body2" color="primary">
        {job?.jobDevices.filter(d => d.status === 'SUCCESS').length || '-'}
      </Typography>
    ),
  }),
  new JobAttribute({
    id: 'jobDeviceFailure',
    label: <JobStatusIcon status="FAILED" />,
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
    defaultWidth: 200,
    value: ({ job }) =>
      job?.updated && (
        <Typography variant="caption" color="grayDarkest.main">
          <Duration startDate={new Date(job.updated)} />
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
]

const attributeLookup = toLookup<Attribute>(jobAttributes, 'id')

export function getJobAttribute(id: string): JobAttribute {
  return attributeLookup[id] || new JobAttribute({ id: 'unknown', label: 'Unknown' })
}
