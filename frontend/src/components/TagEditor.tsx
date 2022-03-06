import React from 'react'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { makeStyles, Chip } from '@material-ui/core'
import { AutocompleteMenu } from './AutocompleteMenu'
import { IconButton, ButtonProps } from '../buttons/IconButton'
import { useLabel } from '../hooks/useLabel'
import { Icon } from './Icon'

type Props = {
  tags?: ITag[]
  filter?: ITag[]
  allowAdding?: boolean
  createOnly?: boolean
  button?: string
  buttonProps?: ButtonProps
  onSelect?: (tag: ITag) => void
}

export const TagEditor: React.FC<Props> = ({
  tags = [],
  filter = [],
  allowAdding = true,
  createOnly,
  button,
  buttonProps,
  onSelect,
}) => {
  const dispatch = useDispatch<Dispatch>()
  const getColor = useLabel()
  const [open, setOpen] = React.useState<boolean>(false)
  const addRef = React.useRef<HTMLDivElement>(null)
  const css = useStyles()

  const handleOpen = () => setOpen(!open)
  const handleClose = () => setOpen(false)

  return (
    <>
      {button ? (
        <div ref={addRef}>
          <IconButton {...buttonProps} icon={button} onClick={handleOpen} disabled={open} />
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
        items={tags}
        open={open}
        indicator="tag"
        filter={filter}
        createOnly={createOnly}
        placeholder={allowAdding ? 'New tag...' : 'Remove a tag...'}
        targetEl={addRef.current}
        onItemColor={tag => getColor(tag.color)}
        onSelect={async (action, tag) => {
          if (action === 'new') await dispatch.tags.create(tag)
          if (onSelect) onSelect(tag)
        }}
        onClose={handleClose}
        allowAdding={allowAdding}
      />
    </>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  chip: { fontWeight: 'bold', letterSpacing: 1, color: palette.grayDarker.main },
}))
