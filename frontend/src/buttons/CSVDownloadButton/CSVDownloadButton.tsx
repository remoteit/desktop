import { IconButton, Tooltip } from '@material-ui/core'
import React, { useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { Dispatch, ApplicationState } from '../../store'
import { useDispatch, useSelector } from 'react-redux'

interface Props {
  deviceID: string
  maxDate: string
}

export function CSVDownloadButton({ deviceID, maxDate }: Props) {
  const dispatch = useDispatch<Dispatch>()
  const { getEventsURL, set } = dispatch.logs
  const eventsURL = useSelector((state: ApplicationState) => state.logs.eventsUrl)
  const [shouldDownload, setShouldDownload] = useState(false)

  useEffect(() => {
    if (shouldDownload && eventsURL) {
      window.open(eventsURL)
      setShouldDownload(false)
      set({ eventsURL: '' })
    }
  }, [eventsURL, shouldDownload])

  const download = () => {
    getEventsURL({ id: deviceID, maxDate: maxDate })
    setShouldDownload(true)
  }

  return (
    <Tooltip title="Download CSV">
      <IconButton>
        <Icon name="arrow-to-bottom" size="md" fixedWidth onClick={download} />
      </IconButton>
    </Tooltip>
  )
}
