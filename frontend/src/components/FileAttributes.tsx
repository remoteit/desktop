import React from 'react'
import { Sizes } from '../styling'
import { Typography } from '@mui/material'
import { Attribute } from './Attributes'
import { Timestamp } from './Timestamp'
import { Duration } from './Duration'
import { Icon, IconProps } from './Icon'
import { Pre } from './Pre'

const argumentIconLookup: ILookup<IconProps> = {
  FileSelect: { name: 'cloud' },
  StringSelect: { name: 'triangle', rotate: 180 },
  StringEntry: { name: 'rectangle-wide' },
}

class ScriptAttribute extends Attribute {
  type: Attribute['type'] = 'SCRIPT'
}

export const scriptAttributes: ScriptAttribute[] = [
  new ScriptAttribute({
    id: 'scriptName',
    label: 'Script',
    required: true,
    defaultWidth: 350,
    value: ({ file }) =>
      file?.name ? (
        <Typography>{file.name}</Typography>
      ) : (
        <Typography variant="body2" color="gray.main" fontStyle="italic">
          Script Deleted&nbsp;
        </Typography>
      ),
  }),
  new ScriptAttribute({
    id: 'scriptArguments',
    label: 'Arguments',
    defaultWidth: 150,
    value: ({ file }) => (
      <>
        {file?.versions?.[0].arguments.map(a => (
          <Typography
            key={a.name}
            variant="caption"
            color="grayDarkest.main"
            component="p"
            sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
          >
            <Icon {...argumentIconLookup[a.argumentType]} fixedWidth type="solid" size="xxxs" color="gray" />
            {a.name}
          </Typography>
        ))}
      </>
    ),
    // value: ({ file }) => <Pre>{script}</Pre>,
  }),
  new ScriptAttribute({
    id: 'scriptDescription',
    label: 'Description',
    defaultWidth: 300,
    value: ({ file }) => file?.shortDesc,
  }),
  new ScriptAttribute({
    id: 'scriptUpdated',
    label: 'Modified',
    defaultWidth: 150,
    value: ({ file }) =>
      file?.updated && (
        <Typography variant="caption" color="grayDarkest.main">
          <Timestamp date={new Date(file.updated)} />
        </Typography>
      ),
  }),
  new ScriptAttribute({
    id: 'scriptCreated',
    label: 'Created',
    defaultWidth: 150,
    value: ({ file }) =>
      file?.created && (
        <Typography variant="caption" color="grayDarkest.main">
          <Timestamp date={new Date(file.created)} />
        </Typography>
      ),
  }),
]
