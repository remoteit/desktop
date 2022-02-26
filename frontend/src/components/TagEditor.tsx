import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { makeStyles, Chip } from '@material-ui/core'
import { AutocompleteMenu } from './AutocompleteMenu'
import { IconButton } from '../buttons/IconButton'
import { useLabel } from '../hooks/useLabel'
import { Icon } from './Icon'
import { Tags } from './Tags'

export const TagEditor: React.FC<{ device?: IDevice; button?: boolean }> = ({ device, button }) => {
  const { labels, tags } = useSelector((state: ApplicationState) => ({
    labels: state.labels,
    tags: state.tags.all,
  }))
  const dispatch = useDispatch<Dispatch>()
  const getColor = useLabel()
  const [newValue, setNewValue] = React.useState<ITag>()
  const [value, setValue] = React.useState<string | undefined>()
  const [open, setOpen] = React.useState<boolean>(false)
  const addRef = React.useRef<HTMLDivElement>(null)
  const css = useStyles()

  const handleOpen = () => setOpen(!open)
  const handleClose = () => setOpen(false)

  return (
    <>
      {device && (
        <Tags
          tags={device.tags}
          onDelete={tag => device && dispatch.tags.remove({ tag, device })}
          onClick={console.log}
        />
      )}
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
        items={tags.filter(t => (device ? !device.tags.includes(t) : !!value?.length))}
        open={open}
        indicator="tag"
        placeholder="New tag..."
        targetEl={addRef.current}
        onChange={value => setValue(value)}
        onItemColor={tag => getColor(tag.color)}
        onSelect={(action, tag) => {
          if (action === 'new') setNewValue(tag)
          else if (device) dispatch.tags.add({ tag, device })
        }}
        onClose={handleClose}
        allowAdding
      />
      <AutocompleteMenu
        items={labels.filter(l => !l.hidden).map(l => ({ name: l.name, color: l.id }))}
        open={Boolean(newValue)}
        placeholder="Choose a color..."
        targetEl={addRef.current}
        onItemColor={item => getColor(item.color)}
        onSelect={async (action, tag) => {
          if (!newValue) return
          const newTag: ITag = { ...newValue, color: tag.color }
          setNewValue(undefined)
          await dispatch.tags.create(newTag)
          if (device) dispatch.tags.add({ tag: newTag, device })
        }}
      />
    </>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  chip: { fontWeight: 'bold', letterSpacing: 1, color: palette.grayDarker.main },
}))
