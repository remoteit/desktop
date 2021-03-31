import { IconButton, Tooltip } from '@material-ui/core'
import React, { useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { Dispatch, ApplicationState } from '../../store'
import { useDispatch, useSelector } from 'react-redux'

interface Props {
  deviceID?: string
  maxDate?: string
  minDate?: string
}

export function CSVDownloadButton({ deviceID, maxDate, minDate }: Props) {
  const dispatch = useDispatch<Dispatch>()
  const { getEventsURL, getLogsURL, set } = dispatch.logs
  const { eventsUrl } = useSelector((state: ApplicationState) => state.logs)
  const [shouldDownload, setShouldDownload] = useState(false)

  useEffect(() => {
    if (shouldDownload && eventsUrl) {
      window.open(eventsUrl)
      setShouldDownload(false)
      set({ eventsURL: '' })
    }
  }, [eventsUrl, shouldDownload])

  const download = () => {
    deviceID ? getEventsURL({ id: deviceID, minDate, maxDate }) : getLogsURL({ id: '', minDate, maxDate })
    setShouldDownload(true)
  }

  return (
    <Tooltip title="Download CSV">
      <IconButton disabled={shouldDownload} onClick={download}>
        <Icon name={shouldDownload ? 'spinner-third' : 'arrow-to-bottom'} size="md" fixedWidth spin={shouldDownload} />
      </IconButton>
    </Tooltip>
  )
}
