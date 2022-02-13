import React from 'react'
import {
  useMediaQuery,
  makeStyles,
  Checkbox,
  Box,
  ListSubheader,
  ListItemIcon,
  LinearProgress,
} from '@material-ui/core'
import { Attribute } from '../helpers/attributes'
import { radius } from '../styling'
import { Icon } from './Icon'

type Props = {
  attributes?: Attribute[]
  select?: boolean
  fetching?: boolean
}

export const DeviceListHeader: React.FC<Props> = ({ attributes = [], select, fetching }) => {
  const largeScreen = useMediaQuery('(min-width:600px)')
  const css = useStyles({ attributes })

  return (
    <ListSubheader>
      <Box className={css.sticky}>
        <ListItemIcon>
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
        </ListItemIcon>
        Name
      </Box>
      {largeScreen && attributes?.map(attribute => <Box key={attribute.id}>{attribute.label}</Box>)}
      {fetching && <LinearProgress className={css.fetching} />}
    </ListSubheader>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  sticky: {
    position: 'sticky',
    left: 0,
    zIndex: 4,
    background: palette.white.main,
    display: 'flex',
    alignItems: 'center',
    borderRadius: radius,
  },
  fetching: {
    position: 'absolute',
    width: '100%',
    zIndex: 10,
    height: 2,
    bottom: 0,
  },
  checkbox: {
    maxWidth: 60,
  },
}))
