import React, { useState } from 'react'
import classnames from 'classnames'
import { makeStyles } from '@mui/styles'
import { Link } from 'react-router-dom'
import { Divider, Menu, MenuItem, ListSubheader, ListItemIcon, Fade, darken } from '@mui/material'
import { DynamicButton, DynamicButtonProps } from './DynamicButton'
import { Icon } from '../components/Icon'

type Props = DynamicButtonProps & {
  options?: { label: string; value: string; color?: string; disabled?: boolean }[]
  onClick: (value?: string) => void
}

export const DynamicButtonMenu: React.FC<Props> = ({ options = [], onClick, ...props }) => {
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
        classes={{ paper: classnames(props.color === 'primary' && css.menu), list: css.subhead }}
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
        TransitionComponent={Fade}
        disableAutoFocusItem
      >
        <ListSubheader disableGutters disableSticky>
          Networks
        </ListSubheader>
        {options.map(option => (
          <MenuItem
            dense
            key={option.value}
            color={option?.color}
            onClick={() => selectHandler(option.value)}
            value={option.value}
            disabled={option.disabled}
            sx={{ color: option.color + '.main' }}
          >
            {option.label}
          </MenuItem>
        ))}
        <Divider />
        <ListSubheader disableGutters disableSticky>
          Create new
        </ListSubheader>
        <MenuItem dense component={Link} to="/networks/new">
          <ListItemIcon>
            <Icon name="plus" />
          </ListItemIcon>
          Network
        </MenuItem>
      </Menu>
    </>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  subhead: {
    paddingTop: 4,
    '& .MuiListSubheader-root + .MuiDivider-root': {
      marginTop: 2,
    },
  },
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
