import React from 'react'
import { connect } from 'react-redux'
import { ApplicationState } from '../../store'

export type SearchOnlyToggleProps = ReturnType<typeof mapState> &
  ReturnType<typeof mapDispatch>

const mapState = (state: ApplicationState) => ({
  searchOnly: state.devices.searchOnly,
})

const mapDispatch = (dispatch: any) => ({
  changeSearchOnly: dispatch.devices.changeSearchOnly,
})

export const SearchOnlyToggle = connect(
  mapState,
  mapDispatch
)(({ changeSearchOnly, searchOnly }: SearchOnlyToggleProps) => {
  return (
    <>
      <label>
        <input
          className="mr-sm"
          type="checkbox"
          checked={searchOnly}
          onChange={e => changeSearchOnly(e.target.checked)}
        />
        Show search only interface
      </label>
      <div className="mt-sm txt-sm gray">
        This will speed up the application if you have a very large device list.
      </div>
    </>
  )
})
