import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { makeStyles, Chip } from '@material-ui/core'
import { AutocompleteMenu } from './AutocompleteMenu'
import { IconButton } from '../buttons/IconButton'
import { useLabel } from '../hooks/useLabel'
import { Color } from '../styling'
import { Icon } from './Icon'

type Props = {
  tags?: ITag[]
  button?: string
  color?: Color
  onSelect?: (tag: ITag) => void
}

export const TagEditor: React.FC<Props> = ({ tags = [], button, color, onSelect }) => {
  const { labels, all } = useSelector((state: ApplicationState) => ({
    labels: state.labels,
    all: state.tags.all,
  }))
  const dispatch = useDispatch<Dispatch>()
  const getColor = useLabel()
  const [value, setValue] = React.useState<ITag>()
  const [open, setOpen] = React.useState<boolean>(false)
  const addRef = React.useRef<HTMLDivElement>(null)
  const css = useStyles()

  const handleOpen = () => setOpen(!open)
  const handleClose = () => setOpen(false)

  return (
    <>
      {button ? (
        <div ref={addRef}>
          <IconButton title="Add Tag" type="solid" color={color} icon={button} onClick={handleOpen} disabled={open} />
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
        items={all.filter(a => !tags.find(t => t.name === a.name))}
        open={open}
        indicator="tag"
        placeholder="New tag..."
        targetEl={addRef.current}
        onItemColor={tag => getColor(tag.color)}
        onSelect={(action, tag) => {
          if (action === 'new') setValue(tag)
          else if (onSelect) onSelect(tag)
        }}
        onClose={handleClose}
        allowAdding
      />
      <AutocompleteMenu
        items={labels.filter(l => !l.hidden).map(l => ({ name: l.name, color: l.id }))}
        open={Boolean(value)}
        placeholder="Choose a color..."
        targetEl={addRef.current}
        onItemColor={item => getColor(item.color)}
        onSelect={async (action, tag) => {
          if (!value) return
          const newTag: ITag = { ...value, color: tag.color }
          setValue(undefined)
          await dispatch.tags.create(newTag)
          if (onSelect) onSelect(newTag)
        }}
      />
    </>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  chip: { fontWeight: 'bold', letterSpacing: 1, color: palette.grayDarker.main },
}))
