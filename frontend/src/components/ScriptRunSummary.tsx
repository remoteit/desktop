import React, { useMemo, useState } from 'react'
import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import { Attribute } from './Attributes'
import { DataDisplay } from './DataDisplay'

type Props = {
  scriptArguments: IFileArgument[]
  argumentValues?: IArgumentValue[]
  jobDevices?: IJobDevice[]
  tag?: ITagFilter
  files?: IFile[]
  maxVisibleDevices?: number
  collapsedVisibleDevices?: number
  runConfigAction?: React.ReactNode
}

const findFileByIdOrVersionId = (files: IFile[], id: string): IFile | undefined => {
  const byFileId = files.find(f => f.id === id)
  if (byFileId) return byFileId
  return files.find(f => f.versions?.some(v => v.id === id))
}

const DeviceChips: React.FC<{ names: string[]; maxVisibleDevices: number; collapsedVisibleDevices: number }> = ({
  names,
  maxVisibleDevices,
  collapsedVisibleDevices,
}) => {
  const [expanded, setExpanded] = useState(false)
  if (!names.length) return <Chip label="No devices" size="small" />
  const displayCount = expanded ? maxVisibleDevices : collapsedVisibleDevices
  const hiddenCount = Math.max(names.length - displayCount, 0)

  return (
    <Box>
      <Stack direction="row" flexWrap="wrap" gap={0.5}>
        {names.slice(0, displayCount).map((name, index) => (
          <Chip key={`${name}-${index}`} label={name} size="small" variant="outlined" />
        ))}
      </Stack>
      {names.length > collapsedVisibleDevices && (
        <Button
          size="small"
          variant="text"
          sx={{ mt: 0.5, px: 0, minWidth: 0 }}
          onClick={() => setExpanded(prev => !prev)}
        >
          {expanded ? 'Show less' : `Show ${hiddenCount} more`}
        </Button>
      )}
    </Box>
  )
}

const TagChips: React.FC<{ tags: string[] }> = ({ tags }) => (
  <Stack direction="row" flexWrap="wrap" gap={0.5}>
    {tags.map((tag, index) => (
      <Chip key={`${tag}-${index}`} label={tag} size="small" variant="outlined" />
    ))}
  </Stack>
)

const ARGUMENT_COLLAPSE_THRESHOLD = 120

const CollapsibleArgumentValue: React.FC<{ value: string; color?: 'textSecondary' | 'warning.main' }> = ({
  value,
  color,
}) => {
  const [expanded, setExpanded] = useState(false)
  const hasOverflow = value.length > ARGUMENT_COLLAPSE_THRESHOLD

  return (
    <Box>
      <Typography
        variant="body2"
        color={color}
        sx={{
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
          ...(hasOverflow &&
            !expanded && {
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }),
        }}
      >
        {value}
      </Typography>
      {hasOverflow && (
        <Button
          size="small"
          variant="text"
          sx={{ mt: 0.5, px: 0, minWidth: 0 }}
          onClick={() => setExpanded(prev => !prev)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      )}
    </Box>
  )
}

export const ScriptRunSummary: React.FC<Props> = ({
  scriptArguments,
  argumentValues = [],
  jobDevices = [],
  tag,
  files = [],
  maxVisibleDevices = 200,
  collapsedVisibleDevices = 2,
  runConfigAction,
}) => {
  const argumentMap = useMemo(() => {
    const result: Record<string, string> = {}
    argumentValues.forEach(arg => {
      result[arg.name] = arg.value || ''
    })
    return result
  }, [argumentValues])

  const argumentRows = useMemo(() => {
    return [...scriptArguments]
      .sort((a, b) => a.order - b.order)
      .map((arg, index) => {
        const rawValue = argumentMap[arg.name] || ''
        let display = rawValue || 'Not set'
        let color: 'textSecondary' | 'warning.main' | undefined = rawValue ? undefined : 'textSecondary'

        if (arg.argumentType === 'FileSelect' && rawValue) {
          const file = findFileByIdOrVersionId(files, rawValue)
          if (file) display = file.name
          else {
            display = `Missing file (${rawValue})`
            color = 'warning.main'
          }
        }

        return new Attribute({
          id: `run-arg-${index}`,
          label: arg.name,
          multiline: true,
          value: () => <CollapsibleArgumentValue value={display} color={color} />,
        })
      })
  }, [scriptArguments, argumentMap, files])

  const deviceNames = jobDevices.map(jd => jd.device.name)
  const hasTagFilter = !!tag?.values?.length
  const runAttributes: Attribute[] = [
    new Attribute({
      id: 'run-targets',
      label: 'Targets',
      value: () => (
        <DeviceChips
          names={deviceNames}
          maxVisibleDevices={maxVisibleDevices}
          collapsedVisibleDevices={collapsedVisibleDevices}
        />
      ),
    }),
    ...(hasTagFilter
      ? [
          new Attribute({
            id: 'run-match',
            label: 'Match',
            value: () => <Chip label={tag?.operator || 'ALL'} size="small" />,
          }),
          new Attribute({
            id: 'run-filter',
            label: 'Filter',
            value: () => <TagChips tags={tag?.values || []} />,
          }),
        ]
      : []),
  ]

  const hasArguments = argumentRows.length > 0

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="subtitle2" color="textSecondary" sx={{ flexGrow: 1, mb: 0 }}>
          Run Configuration
        </Typography>
        {runConfigAction}
      </Box>
      <DataDisplay attributes={runAttributes} disablePadding />
      {hasArguments && (
        <>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom sx={{ mt: 2 }}>
            Arguments
          </Typography>
          <Box>
            <DataDisplay attributes={argumentRows} disablePadding />
          </Box>
        </>
      )}
    </Box>
  )
}
