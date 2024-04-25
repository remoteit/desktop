import { IconButton, Tooltip } from '@mui/material'
import React, { useState } from 'react'
import { windowOpen } from '../../services/Browser'
import { Icon } from '../../components/Icon'

interface CSVDownloadButtonProps {
  fetchUrl: () => Promise<string | undefined>
}

export function CSVDownloadButton({ fetchUrl }: CSVDownloadButtonProps) {
  const [fetching, setFetching] = useState<boolean>(false)

  const download = async () => {
    setFetching(true)
    const url = await fetchUrl()
    if (url) windowOpen(url)
    setFetching(false)
  }

  return (
    <Tooltip title="Download CSV">
      <IconButton disabled={fetching} onClick={download} size="large">
        <Icon name={fetching ? 'spinner-third' : 'arrow-to-bottom'} size="md" fixedWidth spin={fetching} />
      </IconButton>
    </Tooltip>
  )
}
