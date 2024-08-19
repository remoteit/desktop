import React from 'react'
import { Chip, Typography } from '@mui/material'
import { ReactiveTagNames } from './ReactiveTagNames'
import { Attribute } from './Attributes'
import { Timestamp } from './Timestamp'
import { Duration } from './Duration'
import { Icon } from './Icon'

const argumentIconLookup = {
  FileSelect: 'file',
  StringSelect: 'square-chevron-down',
  StringEntry: 'input-text',
}

class jobAttribute extends Attribute {
  type: Attribute['type'] = 'SCRIPT'
}

export const jobAttributes: jobAttribute[] = [
  new jobAttribute({
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
  new jobAttribute({
    id: 'jobDeviceCount',
    label: <Icon platform={65535} platformIcon />,
    defaultWidth: 50,
    value: ({ job }) => job?.jobDevices.length || '-',
  }),
  new jobAttribute({
    id: 'jobDeviceSuccess',
    label: <Icon name="badge-check" type="solid" color="primary" />,
    defaultWidth: 50,
    value: ({ job }) => (
      <Typography color="primary">{job?.jobDevices.filter(d => d.status === 'SUCCESS').length || '-'}</Typography>
    ),
  }),
  new jobAttribute({
    id: 'jobDeviceFailure',
    label: <Icon name="octagon-xmark" type="solid" color="error" />,
    defaultWidth: 50,
    value: ({ job }) => (
      <Typography color="error">
        {job?.jobDevices.filter(d => d.status === 'FAILED' || d.status === 'CANCELLED').length || '-'}
      </Typography>
    ),
  }),
  new jobAttribute({
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
  new jobAttribute({
    id: 'jobTags',
    label: 'Filter',
    defaultWidth: 100,
    value: ({ job }) =>
      job?.tag.values.length ? <ReactiveTagNames tags={job.tag.values} /> : <Chip label="None" size="small" />,
  }),
  new jobAttribute({
    id: 'jobMatches',
    label: 'Match',
    defaultWidth: 100,
    value: ({ job }) => <Chip label={job?.tag.operator} size="small" />,
  }),
]
