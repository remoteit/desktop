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
    value: ({ script }) => script?.name,
  }),
  new ScriptAttribute({
    id: 'scriptUpdated',
    label: 'Modified',
    defaultWidth: 200,
    value: ({ script }) => script?.updated && <Duration startDate={new Date(script.updated)} />,
  }),
  new ScriptAttribute({
    id: 'scriptDescription',
    label: 'Description',
    defaultWidth: 300,
    value: ({ script }) => script?.shortDesc,
  }),
  new ScriptAttribute({
    id: 'scriptArguments',
    label: 'Arguments',
    defaultWidth: 150,
    value: ({ script }) => (
      <>
        {script?.versions?.[0].arguments.map(a => (
          <>
            <Typography variant="body2">
              <Icon name={argumentIconLookup[a.argumentType]} inlineLeft />
              {a.name}
            </Typography>
            <Typography variant="caption">{a.desc}</Typography>
          </>
        ))}
      </>
    ),
    // value: ({ script }) => <Pre>{script}</Pre>,
  }),
  new ScriptAttribute({
    id: 'scriptCreated',
    label: 'Created',
    defaultWidth: 200,
    value: ({ script }) => script?.created && <Timestamp date={new Date(script.created)} />,
  }),
]
