import React from 'react'
import { DebugLogItem } from '../DebugLogItem'
import { CopyButton } from '../CopyButton'

export interface Props {
  logs: Log[]
}

export function DebugLog({ logs }: Props) {
  return (
    <div className="bg-white bs-2 mb-xl">
      <div className="right mb-md">
        <CopyButton
          text={JSON.stringify(logs, null, 2)}
          title="Copy all logs"
        />
      </div>
      {logs.map((log, key) => (
        <DebugLogItem key={key} log={log} />
      ))}
    </div>
  )
}
