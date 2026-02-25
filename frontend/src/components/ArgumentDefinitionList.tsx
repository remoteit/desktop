import React from 'react'
import { List, ListItem, ListItemIcon, ListItemText, Button, Stack, Typography } from '@mui/material'
import { Icon } from './Icon'
import { EditButton } from '../buttons/EditButton'

type ArgumentTypeOption = {
  value: IFileArgumentType
  label: string
  description: string
}

type Props = {
  definitions: IArgumentDefinition[]
  disabled?: boolean
  editing: number | 'new' | null
  dragIndex: number | null
  dragOverIndex: number | null
  argumentTypes: ArgumentTypeOption[]
  onStartNew: () => void
  onStartEdit: (index: number) => void
  onDragStart: (index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDrop: (e: React.DragEvent, index: number) => void
  onDragEnd: () => void
  renderItemEditor?: (index: number) => React.ReactNode
}

export const ArgumentDefinitionList: React.FC<Props> = ({
  definitions,
  disabled,
  editing,
  dragIndex,
  dragOverIndex,
  argumentTypes,
  onStartNew,
  onStartEdit,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  renderItemEditor,
}) => {
  return (
    <>
      <Stack direction="row" alignItems="center" mb={1}>
        <Typography variant="subtitle2">Script Arguments</Typography>
        {!disabled && editing !== 'new' && (
          <Button size="small" startIcon={<Icon name="plus" size="sm" />} onClick={onStartNew} sx={{ ml: 'auto' }}>
            Add
          </Button>
        )}
      </Stack>

      <List disablePadding dense>
        {definitions.map((def, index) => (
          <React.Fragment key={index}>
            <ListItem
              dense
              disableGutters
              draggable={!disabled && editing !== index}
              onDragStart={() => onDragStart(index)}
              onDragOver={e => onDragOver(e, index)}
              onDrop={e => onDrop(e, index)}
              onDragEnd={onDragEnd}
              sx={{
                bgcolor: editing === index ? 'primaryBackground.main' : 'grayLightest.main',
                opacity: dragIndex === index ? 0.4 : 1,
                transition: 'background-color 0.15s ease',
                cursor: !disabled && editing !== index ? 'grab' : undefined,
                paddingRight: 2,
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: dragOverIndex === index ? 'primary.main' : 'white.main',
                '&:active': !disabled && editing !== index ? { cursor: 'grabbing' } : undefined,
              }}
            >
              <ListItemIcon>
                <Icon name="grip-vertical" type="solid" size="sm" />
              </ListItemIcon>
              <ListItemText
                primary={def.name}
                secondary={
                  <>
                    {argumentTypes.find(t => t.value === def.type)?.label || def.type}
                    {def.desc && ` - ${def.desc}`}
                    {def.options?.length ? ` (${def.options.length} options)` : ''}
                  </>
                }
              />
              {!disabled && editing !== index && <EditButton className="hidden" onClick={() => onStartEdit(index)} />}
            </ListItem>
            {renderItemEditor?.(index)}
          </React.Fragment>
        ))}
      </List>

      {definitions.length === 0 && editing !== 'new' && (
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          No arguments defined. Arguments allow users to provide input values when running the script.
        </Typography>
      )}
    </>
  )
}
