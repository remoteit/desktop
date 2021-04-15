import React from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { IconButton, Menu, MenuItem } from '@material-ui/core'
import { Icon } from './Icon'

type Props = {
  allowScanning?: boolean
  button?: boolean
}

const options = [
    { value: 0, name: 'Alphabetical(A-Z)' },
    { value: 1, name: 'Alphabetical(Z-A)' },
    { value: 2, name: 'Creation Date (Newest)' },
    { value: 3, name: 'Creation Date (Oldest)' },
  ];
  
const ITEM_HEIGHT = 48;

export const SortServices: React.FC<Props> = ({ allowScanning, button }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };


  return (
    <>
      <IconButton
        aria-label="more"
        aria-controls="long-menu"
        aria-haspopup="true"
        onClick={handleClick}

      >
        <Icon name="sort-amount-down" size="md" />
      </IconButton>
      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: ITEM_HEIGHT * 4.5,
            width: '20ch',
          },
        }}
      >
        {options.map((option, index) => (
          <MenuItem key={index} selected={option.value === 0} onClick={handleClose}>
            {option.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  ) 
}
