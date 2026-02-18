import React from 'react'
import { ScriptConfigPage } from './ScriptConfigPage'

type Props = { center?: boolean }

export const ScriptAddPage: React.FC<Props> = () => {
  return <ScriptConfigPage isNew showBack />
}
