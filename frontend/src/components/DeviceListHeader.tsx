import React from 'react'
import { Attribute } from '../helpers/attributes'
import { Icon } from './Icon'
import { makeStyles, Checkbox, ListItem, ListItemIcon, ListSubheader, useMediaQuery } from '@material-ui/core'
type Props = {
  primary?: Attribute
  attributes?: Attribute[]
  select?: boolean
}

export const DeviceListHeader: React.FC<Props> = ({ primary, attributes = [], select }) => {
  const largeScreen = useMediaQuery('(min-width:600px)')
  const css = useStyles({ attributes, primary })

  return (
    <ListItem className={css.header}>
      {select && (
        <Checkbox
          // checked={checked}
          // indeterminate={indeterminate}
          // inputRef={inputRef}
          // onChange={event => onClick(event.target.checked)}
          className={css.checkbox}
          onClick={event => event.stopPropagation()}
          checkedIcon={<Icon name="check-square" size="md" type="solid" />}
          indeterminateIcon={<Icon name="minus-square" size="md" type="solid" />}
          icon={<Icon name="square" size="md" />}
          color="primary"
        />
      )}
      <ListItemIcon></ListItemIcon>
      <ListSubheader disableGutters>Role</ListSubheader>
      {largeScreen && attributes?.map(attribute => <ListSubheader disableGutters>{attribute.label}</ListSubheader>)}
    </ListItem>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  header: {
    position: 'sticky',
    backgroundColor: palette.white.main,
    zIndex: 10,
    top: 0,
  },
  checkbox: {
    maxWidth: 60,
  },
}))
