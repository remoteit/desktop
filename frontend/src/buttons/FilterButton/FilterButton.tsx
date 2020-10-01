import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../../components/Icon'

export const FilterButton = ({
  handleDrawer,
  open,
}: {
  handleDrawer: (state: boolean) => void
  open: boolean
}): JSX.Element => {
  function handleChange() {
    handleDrawer(!open)
  }

  return (
    <>
      <Tooltip title="Show filter panel">
        <IconButton onClick={handleChange}>
          <Icon name="filter" color="grayDarker" size="base" type="regular" />
        </IconButton>
      </Tooltip>
    </>
  )
}
