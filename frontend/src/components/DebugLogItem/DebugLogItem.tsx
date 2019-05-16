import React, { useState } from 'react'
import moment from 'moment'
import { CopyButton } from '../CopyButton'
import { Icon } from '../Icon'
import { Tooltip } from '@material-ui/core'

export interface Props {
  log: Log
}

export function DebugLogItem({ log }: Props) {
  const data = JSON.stringify(log.data, null, 2)
  const [opened, setOpen] = useState<boolean>(false)

  const isConnectd = log.type === 'connectd'
  const isAlert = log.type === 'alert'

  let title = 'General message'
  let iconName = 'bell'
  let iconColor = 'secondary' as BrandColors
  if (isConnectd) {
    title = 'connectd process message'
    iconName = 'terminal'
    iconColor = 'primary'
  }
  if (isAlert) {
    title = 'Alert'
    iconColor = 'danger'
  }

  return (
    <div className="px-md py-sm bb bc-gray-lighter txt-sm">
      <div className="txt-sm df ai-center">
        <div className="txt-md mr-md">
          <Tooltip title={title}>
            <Icon name={iconName} color={iconColor} fixedWidth />
          </Tooltip>
        </div>
        {log.message}
        <span className="ml-auto txt-xs gray-light">
          {moment(log.createdAt).fromNow()}
        </span>
        {data && (
          <Icon
            name={opened ? 'chevron-up' : 'chevron-down'}
            size="lg"
            color="gray"
            className="ml-md c-pointer"
            onClick={() => setOpen(!opened)}
          />
        )}
      </div>
      {data && opened && (
        <div className="mt-md">
          <div className="fr mt-sm mr-sm">
            <CopyButton text={data} />
          </div>
          <pre className="ff-mono txt-sm p-md bg-gray-lightest secondary">
            {data}
          </pre>
        </div>
      )}
    </div>
  )
}
