import React from 'react'
import { Typography } from '@mui/material'
import { Attribute } from './Attributes'
import { Timestamp } from './Timestamp'
import { Duration } from './Duration'
import { Icon } from './Icon'
import { Pre } from './Pre'

const argumentIconLookup = {
  FileSelect: 'file',
  StringSelect: 'square-chevron-down',
  StringEntry: 'input-text',
}

class ScriptAttribute extends Attribute {
  type: Attribute['type'] = 'SCRIPT'
}

export const scriptAttributes: ScriptAttribute[] = [
  new ScriptAttribute({
    id: 'scriptName',
    label: 'Script',
    required: true,
    defaultWidth: 300,
    value: ({ file }) => file?.name,
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
  new ScriptAttribute({
    id: 'scriptArguments',
    label: 'Arguments',
    defaultWidth: 150,
    value: ({ file }) => (
      <>
        {file?.versions?.[0].arguments.map((a, index) => (
          <Typography key={index} variant="caption" color="grayDarker.main" component="p">
            <Icon name={argumentIconLookup[a.argumentType]} color="grayDark" inlineLeft fixedWidth />
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
]
