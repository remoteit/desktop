import React, { useState } from 'react'
import { Collapse, Typography, Box } from '@mui/material'
import { ArgumentDefinitionList } from './ArgumentDefinitionList'
import { ArgumentDefinitionEditForm } from './ArgumentDefinitionEditForm'
import { radius } from '../styling'

type Props = {
  definitions: IArgumentDefinition[]
  onChange: (definitions: IArgumentDefinition[]) => void
  disabled?: boolean
}

const ARGUMENT_TYPES: { value: IFileArgumentType; label: string; description: string }[] = [
  { value: 'StringEntry', label: 'Text Input', description: 'Free text entry field' },
  { value: 'StringSelect', label: 'Dropdown', description: 'Select from predefined options' },
  { value: 'FileSelect', label: 'File Select', description: 'Select a file (optionally filter by extension)' },
]

const emptyDefinition: IArgumentDefinition = {
  name: '',
  type: 'StringEntry',
  desc: '',
  options: [],
}

export const ArgumentDefinitionForm: React.FC<Props> = ({ definitions, onChange, disabled }) => {
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const [editForm, setEditForm] = useState<IArgumentDefinition>(emptyDefinition)
  const [optionsText, setOptionsText] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const startEdit = (index: number) => {
    const def = definitions[index]
    setEditing(index)
    setEditForm(def)
    setOptionsText(def.options?.join(', ') || '')
  }

  const toggleEdit = (index: number) => {
    if (editing === index) {
      cancelEdit()
      return
    }
    startEdit(index)
  }

  const startNew = () => {
    setEditing('new')
    setEditForm(emptyDefinition)
    setOptionsText('')
  }

  const cancelEdit = () => {
    setEditing(null)
    setEditForm(emptyDefinition)
    setOptionsText('')
  }

  const saveEdit = () => {
    const options = optionsText
      .split(',')
      .map(o => o.trim())
      .filter(o => o.length > 0)

    const updated: IArgumentDefinition = {
      ...editForm,
      options: options.length > 0 ? options : undefined,
    }

    if (editing === 'new') {
      onChange([...definitions, updated])
    } else if (typeof editing === 'number') {
      const newDefs = [...definitions]
      newDefs[editing] = updated
      onChange(newDefs)
    }
    cancelEdit()
  }

  const deleteDefinition = (index: number) => {
    onChange(definitions.filter((_, i) => i !== index))
    if (editing === 'new') return
    if (typeof editing === 'number') {
      if (editing === index) {
        cancelEdit()
      } else if (editing > index) {
        setEditing(editing - 1)
      }
    }
  }

  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    const newDefs = [...definitions]
    const [moved] = newDefs.splice(dragIndex, 1)
    newDefs.splice(index, 0, moved)

    // If we're editing an item, update the editing index to follow the moved item
    if (typeof editing === 'number') {
      if (editing === dragIndex) {
        setEditing(index)
      } else if (dragIndex < editing && index >= editing) {
        setEditing(editing - 1)
      } else if (dragIndex > editing && index <= editing) {
        setEditing(editing + 1)
      }
    }

    onChange(newDefs)
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const canSave = editForm.name.trim().length > 0

  const showOptions = editForm.type === 'StringSelect' || editForm.type === 'FileSelect'

  return (
    <>
      <ArgumentDefinitionList
        definitions={definitions}
        disabled={disabled}
        editing={editing}
        dragIndex={dragIndex}
        dragOverIndex={dragOverIndex}
        argumentTypes={ARGUMENT_TYPES}
        onStartNew={startNew}
        onToggleEdit={toggleEdit}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        renderItemEditor={index => (
          <Collapse in={editing === index} unmountOnExit>
            <Box
              sx={{
                padding: 2,
                borderBottomRightRadius: radius.lg + 'px',
                borderBottomLeftRadius: radius.lg + 'px',
                backgroundColor: 'primaryBackground.main',
                marginBottom: 1,
              }}
            >
              <ArgumentDefinitionEditForm
                form={editForm}
                optionsText={optionsText}
                showOptions={showOptions}
                canSave={canSave}
                argumentTypes={ARGUMENT_TYPES}
                onFormChange={setEditForm}
                onOptionsChange={setOptionsText}
                onSave={saveEdit}
                onCancel={cancelEdit}
                onDelete={() => deleteDefinition(index)}
              />
            </Box>
          </Collapse>
        )}
      />

      <Collapse in={editing === 'new'} unmountOnExit>
        <Box sx={{ mt: 1, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            New Argument
          </Typography>
          <ArgumentDefinitionEditForm
            form={editForm}
            optionsText={optionsText}
            showOptions={showOptions}
            canSave={canSave}
            argumentTypes={ARGUMENT_TYPES}
            onFormChange={setEditForm}
            onOptionsChange={setOptionsText}
            onSave={saveEdit}
            onCancel={cancelEdit}
          />
        </Box>
      </Collapse>
    </>
  )
}
