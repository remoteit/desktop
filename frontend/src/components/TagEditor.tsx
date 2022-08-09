import React, { useEffect } from 'react'
import { makeStyles } from '@mui/styles'
import { Chip, Tooltip } from '@mui/material'
import { TagAutocomplete } from './TagAutocomplete'
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
  onCreate?: (tag: ITag) => void
  onSelect?: (tag: ITag) => void
}

export const TagEditor: React.FC<Props> = ({
  tags = [],
  filter = [],
  allowAdding = true,
  createOnly,
  button,
  buttonProps,
  onCreate,
  onSelect,
}) => {
  const getColor = useLabel()
  const [open, setOpen] = React.useState<boolean>(false)
  const addRef = React.useRef<HTMLDivElement>(null)
  const css = useStyles()

  const handleOpen = () => setOpen(!open)
  const handleClose = () => setOpen(false)

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === '#') {
      event.preventDefault()
      handleOpen()
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

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
      <TagAutocomplete
        items={tags}
        open={open}
        indicator="tag"
        filter={filter}
        createOnly={createOnly}
        placeholder={allowAdding ? 'New tag...' : 'Remove a tag...'}
        targetEl={addRef.current}
        onItemColor={tag => getColor(tag.color)}
        InputProps={{
          endAdornment: (
            <Tooltip title="Keyboard shortcut '#'" placement="top" arrow>
              <Chip label="#" size="small" />
            </Tooltip>
          ),
        }}
        onSelect={async (action, tag) => {
          if (action === 'new') onCreate && onCreate(tag)
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
