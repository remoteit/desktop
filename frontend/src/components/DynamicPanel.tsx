import React from 'react'
import { useLocation, matchPath } from 'react-router-dom'
import { DoublePanel } from './DoublePanel'
import { Panel } from './Panel'

type Props = {
  primary: React.ReactElement
  secondary?: React.ReactElement
  singlePanel?: boolean
  root?: string | string[]
}

export const DynamicPanel: React.FC<Props> = ({ singlePanel, root, ...props }) => {
  const location = useLocation()
  const match = matchPath(location.pathname, { path: root, exact: true })

  if (singlePanel) {
    return <Panel>{match ? props.primary : props.secondary}</Panel>
  }

  return <DoublePanel {...props} />
}
