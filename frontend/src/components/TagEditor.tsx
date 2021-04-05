import React from 'react'
import { MAX_NAME_LENGTH, REGEX_NAME_SAFE } from '../shared/constants'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { makeStyles, Button } from '@material-ui/core'
import { AutocompleteMenu } from './AutocompleteMenu'
import { Icon } from './Icon'

export const TagEditor: React.FC<{ device: IDevice }> = ({ device }) => {
  const css = useStyles()
  const tags = useSelector((state: ApplicationState) => state.labels)

  const [newValue, setNewValue] = React.useState<ILabel>()
  const [open, setOpen] = React.useState<boolean>(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  const handleOpen = () => setOpen(!open)
  const handleClose = () => setOpen(false)
  const handleAddTag = tag => console.log('ADD TAG', tag)

  if (!device) return null

  return (
    <>
      <Button variant="text" size="small" onClick={handleOpen} ref={buttonRef}>
        <Icon name="plus" size="sm" inlineLeft />
        add tag
      </Button>
      <AutocompleteMenu
        items={tags}
        open={open}
        placeholder="New tag..."
        targetEl={buttonRef.current}
        onSelect={(action, tag) => {
          if (action === 'new') setNewValue(tag)
          else handleAddTag(tag)
        }}
        onClose={handleClose}
        allowAdding
      />
      <AutocompleteMenu
        items={tags}
        open={Boolean(newValue)}
        placeholder="Choose color..."
        targetEl={buttonRef.current}
        onSelect={(action, tag) => {
          tag = { ...(newValue || tag), color: tag.color }
          setNewValue(undefined)
          handleAddTag(tag)
        }}
        onClose={handleClose}
      />
    </>
  )
}

const useStyles = makeStyles({
  overlap: { position: 'absolute', left: 28, top: 20, zIndex: 1 },
})
