import React, { useState } from 'react'
import { makeStyles, Menu, MenuItem, Fade, darken } from '@material-ui/core'
import { DynamicButton, DynamicButtonProps } from './DynamicButton'

type Props = DynamicButtonProps & {
  options: { label: string; value: string }[]
  onClick: (value?: string) => void
}

export const DynamicButtonMenu: React.FC<Props> = ({ options, onClick, ...props }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [menuWidth, setMenuWidth] = useState<number>()
  const css = useStyles(props)

  const clickHandler = event => {
    setAnchorEl(event.currentTarget)
    setMenuWidth(event.currentTarget.offsetWidth)
  }

  const closeHandler = () => {
    setAnchorEl(null)
  }

  const selectHandler = (value?: string) => {
    closeHandler()
    onClick(value)
  }

  if (options.length < 2) return <DynamicButton {...props} onClick={() => selectHandler(options[0].value)} />

  return (
    <>
      <DynamicButton
        {...props}
        onClick={clickHandler}
        icon={props.icon || 'caret-down'}
        iconType={props.size === 'icon' ? undefined : 'solid'}
      />
      <Menu
        elevation={2}
        classes={{ paper: props.color === 'primary' ? css.menu : undefined }}
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={closeHandler}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{ style: { minWidth: menuWidth } }}
        getContentAnchorEl={null}
        TransitionComponent={Fade}
        disableAutoFocusItem
      >
        {options.map(option => (
          <MenuItem key={option.value} dense onClick={() => selectHandler(option.value)} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  menu: {
    '& .MuiList-root': {
      backgroundColor: palette.primary.main,
    },
    '& .MuiListItem-root': {
      color: palette.alwaysWhite.main,
      fontWeight: '500',
      '&:hover': {
        backgroundColor: darken(palette.primary.main, 0.1),
      },
      '&:focus': {
        backgroundColor: darken(palette.primary.main, 0.1),
      },
      '&:focus:hover': {
        backgroundColor: darken(palette.primary.main, 0.15),
      },
    },
  },
}))
