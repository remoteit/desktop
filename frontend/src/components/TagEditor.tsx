import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { makeStyles, Chip } from '@material-ui/core'
import { AutocompleteMenu } from './AutocompleteMenu'
import { IconButton } from '../buttons/IconButton'
import { colors } from '../styling'
import { Icon } from './Icon'
import { Tags } from './Tags'

export const TagEditor: React.FC<{ device?: IDevice; button?: boolean }> = ({ device, button }) => {
  const { labels, tags } = useSelector((state: ApplicationState) => ({
    labels: state.labels,
    tags: state.tags.all,
  }))
  const dispatch = useDispatch<Dispatch>()
  const [newValue, setNewValue] = React.useState<ITag>()
  const [value, setValue] = React.useState<string | undefined>()
  const [open, setOpen] = React.useState<boolean>(false)
  const addRef = React.useRef<HTMLDivElement>(null)
  const css = useStyles()

  const getColor = id => labels.find(l => l.id === id)?.color || labels[0].color
  const handleOpen = () => setOpen(!open)
  const handleClose = () => setOpen(false)
  const handleAddTag = (tag: ITag) => {
    if (!device) return
    device.tags.push(tag.id)
    dispatch.accounts.setDevice({ id: device.id, device })
  }
  const handleRemoveTag = id => {
    if (!device) return
    const index = device.tags.indexOf(id)
    device.tags.splice(index, 1)
    dispatch.accounts.setDevice({ id: device.id, device })
  }

  return (
    <>
      {device && <Tags ids={device.tags} onDelete={id => handleRemoveTag(id)} onClick={console.log} />}
      {button ? (
        <div ref={addRef}>
          <IconButton title="Add Tag" icon="plus" onClick={handleOpen} disabled={open} />
        </div>
      ) : (
        <Chip
          label={
            <>
              <Icon name="plus" size="sm" inlineLeft />
              TAG
            </>
          }
          className={css.chip}
          size="small"
          onClick={handleOpen}
          ref={addRef}
        />
      )}
      <AutocompleteMenu
        items={tags.filter(t => (device ? !device.tags.includes(t.id) : !!value?.length))}
        open={open}
        indicator="tag"
        placeholder="New tag..."
        targetEl={addRef.current}
        onChange={value => {
          setValue(value)
          console.log('onchange', value)
        }}
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
        targetEl={addRef.current}
        onItemColor={item => item.color || ''}
        onSelect={(action, label) => {
          const newTag = { ...(newValue || label), label: label.id, id: tags.length }
          setNewValue(undefined)
          handleAddTag(newTag)
          dispatch.tags.set({ all: [...tags, newTag] })
        }}
      />
    </>
  )
}

const useStyles = makeStyles({
  chip: { fontWeight: 'bold', letterSpacing: 1, color: colors.grayDarker },
})
