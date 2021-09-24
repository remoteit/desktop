import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { IconButton } from '../buttons/IconButton'
import { Notice } from './Notice'

export const SearchedNotice: React.FC = () => {
  const { searched, query } = useSelector((state: ApplicationState) => state.devices)
  const { devices } = useDispatch<Dispatch>()

  return searched ? (
    <Notice
      button={
        <IconButton
          icon="times"
          color="primary"
          onClick={() => {
            devices.set({ query: '', searched: false, from: 0 })
            devices.fetch()
          }}
        />
      }
    >
      Searched for “{query}”
    </Notice>
  ) : null
}
