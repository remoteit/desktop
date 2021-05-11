import React, { useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  makeStyles,
  Menu,
  Input,
  MenuItem,
  FormControl,
  Select,
  Checkbox,
  ListItemText,
  Tooltip,
  IconButton,
  Badge,
} from '@material-ui/core'
import { state as defaults } from '../models/devices'
import { ApplicationState, Dispatch } from '../store'
import { Icon } from '../components/Icon'

export const ColumnsButton: React.FC = () => {
  const css = useStyles()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [el, setEl] = useState<HTMLButtonElement | null>()
  const { open } = useSelector((state: ApplicationState) => ({
    open: state.ui.drawerMenu === 'COLUMNS',
  }))
  const { ui } = useDispatch<Dispatch>()

  const [personName, setPersonName] = React.useState<string[]>([])

  const names = [
    'Oliver Hansen',
    'Van Henry',
    'April Tucker',
    'Ralph Hubbard',
    'Omar Alexander',
    'Carlos Abbott',
    'Miriam Wagner',
    'Bradley Wilkerson',
    'Virginia Andrews',
    'Kelly Snyder',
  ]

  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setPersonName(event.target.value as string[])
  }

  return (
    <>
      <Tooltip title="Columns">
        {/* <IconButton onClick={() => setEl(buttonRef.current)} ref={buttonRef}> */}
        <IconButton onClick={() => ui.set({ drawerMenu: open ? null : 'COLUMNS' })}>
          <Icon name="line-columns" size="base" fixedWidth />
        </IconButton>
      </Tooltip>
      {/* <FormControl>
        <Select
          multiple
          value={personName}
          onChange={handleChange}
          onClose={() => setEl(null)}
          input={<Input hidden />}
          className={css.select}
          MenuProps={{
            open: Boolean(el),
            anchorEl: el,
            onClose: () => setEl(null),
            anchorOrigin: { horizontal: 'left', vertical: 'bottom' },
            getContentAnchorEl: null,
            elevation: 2,
          }}
        >
          {names.map(name => (
            <MenuItem key={name} value={name} dense>
              <Checkbox
                checked={personName.indexOf(name) > -1}
                checkedIcon={<Icon name="check" size="md" />}
                icon={<Icon />}
              />
              <ListItemText primary={name} />
            </MenuItem>
          ))}
        </Select>
      </FormControl> */}

      {/* <Menu
        open={Boolean(el)}
        anchorEl={el}
        onClose={() => setEl(null)}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        getContentAnchorEl={null}
        disableScrollLock
        elevation={2}
      >
        <MenuItem dense onClick={() => {}}>
          menu item
        </MenuItem>
      </Menu> */}
    </>
  )
}

const useStyles = makeStyles({
  select: { overflow: 'hidden', width: 0 },
})
