import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { makeStyles, Button } from '@material-ui/core'
import { AutocompleteMenu } from './AutocompleteMenu'
import { Icon } from './Icon'
import { Tag } from './Tag'

export const TagEditor: React.FC<{ device: IDevice }> = ({ device }) => {
  const labels = useSelector((state: ApplicationState) => state.labels)
  const [tempTags, setTempTags] = React.useState<ITag[]>([
    {
      id: 0,
      name: 'AWS',
      label: 1,
    },
    {
      id: 1,
      name: 'Trusted',
      label: 5,
    },
    {
      id: 2,
      name: 'Shared',
      label: 7,
    },
    {
      id: 3,
      name: 'Important',
      label: 2,
    },
  ])
  const [newValue, setNewValue] = React.useState<ITag>()
  const [open, setOpen] = React.useState<boolean>(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  const getColor = id => labels.find(l => l.id === id)?.color || labels[0].color
  const handleOpen = () => setOpen(!open)
  const handleClose = () => setOpen(false)
  const handleAddTag = (tag: ITag) => setTempTags([...tempTags, tag])
  const handleRemoveTag = index => {
    let result = [...tempTags]
    result.splice(index, 1)
    setTempTags(result)
  }

  if (!device) return null

  return (
    <>
      {tempTags.map((tag, index) => (
        <Tag key={index} tag={tag} labels={labels} onDelete={() => handleRemoveTag(index)} onClick={console.log} />
      ))}
      <Button variant="text" size="small" onClick={handleOpen} ref={buttonRef}>
        <Icon name="plus" size="sm" inlineLeft />
        add tag
      </Button>
      <AutocompleteMenu
        items={tempTags}
        open={open}
        indicator="tag"
        placeholder="New tag..."
        targetEl={buttonRef.current}
        onItemColor={tag => getColor(tag.label)}
        onSelect={(action, tag) => {
          if (action === 'new') setNewValue(tag)
          else handleAddTag(tag)
        }}
        onClose={handleClose}
        allowAdding
      />
      <AutocompleteMenu
        items={labels.filter(l => !l.hidden)}
        open={Boolean(newValue)}
        placeholder="Choose a color..."
        targetEl={buttonRef.current}
        onItemColor={item => item.color || ''}
        onSelect={(action, label) => {
          setNewValue(undefined)
          handleAddTag({ ...(newValue || label), label: label.id, id: tempTags.length })
        }}
      />
    </>
  )
}
