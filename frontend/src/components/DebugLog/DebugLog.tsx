import React from 'react'
import { DebugLogItem } from '../DebugLogItem'
import { CopyButton } from '../CopyButton'
import { Button } from '@material-ui/core'

export interface Props {
  logs: Log[]
}

export function DebugLog({ logs }: Props) {
  return (
    <div className="bg-white bs-2 mb-xl">
      <div className="right py-sm px-md"></div>
      {logs.map((log, key) => (
        <DebugLogItem key={key} log={log} />
      ))}
    </div>
  )
}
