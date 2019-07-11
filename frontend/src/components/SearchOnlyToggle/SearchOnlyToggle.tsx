import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../Icon'
import { connect } from 'react-redux'
import { ApplicationState } from '../../store'

export type SearchOnlyToggleProps = ReturnType<typeof mapState> &
  ReturnType<typeof mapDispatch>

const mapState = (state: ApplicationState) => ({
  searchOnly: state.devices.searchOnly,
})

const mapDispatch = (dispatch: any) => ({
  setSearchOnly: dispatch.devices.setSearchOnly,
})

export const SearchOnlyToggle = connect(
  mapState,
  mapDispatch
)(({ setSearchOnly, searchOnly }: SearchOnlyToggleProps) => {
  return (
    <>
      <label>
        <input
          className="mr-sm"
          type="checkbox"
          checked={searchOnly}
          onChange={e => setSearchOnly(e.target.checked)}
        />
        Show search only interface
      </label>
      <div className="mt-sm txt-sm gray">
        This will speed up the application if you have a very large device list.
      </div>
    </>
  )
})
