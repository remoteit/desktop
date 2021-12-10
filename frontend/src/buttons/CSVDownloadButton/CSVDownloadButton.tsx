import { IconButton, Tooltip } from '@material-ui/core'
import React, { useState } from 'react'
import { Icon } from '../../components/Icon'
import { Dispatch } from '../../store'
import { useDispatch } from 'react-redux'
import { windowOpen } from '../../services/Browser'

export function CSVDownloadButton() {
  const { logs } = useDispatch<Dispatch>()
  const [fetching, setFetching] = useState<boolean>(false)

  const download = async () => {
    setFetching(true)
    const url = await logs.fetchUrl()
    if (url) windowOpen(url)
    setFetching(false)
  }

  return (
    <Tooltip title="Download CSV">
      <IconButton disabled={fetching} onClick={download}>
        <Icon name={fetching ? 'spinner-third' : 'arrow-to-bottom'} size="md" fixedWidth spin={fetching} />
      </IconButton>
    </Tooltip>
  )
}
