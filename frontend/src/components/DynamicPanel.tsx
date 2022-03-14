import React from 'react'
import { useLocation, matchPath } from 'react-router-dom'
import { DoublePanel } from './DoublePanel'
import { Panel } from './Panel'

type Props = {
  primary: React.ReactElement
  secondary?: React.ReactElement
  layout?: ILayout
  root?: string | string[]
}

export const DynamicPanel: React.FC<Props> = ({ layout, root, ...props }) => {
  const location = useLocation()
  const match = matchPath(location.pathname, { path: root, exact: true })

  if (layout?.singlePanel) {
    return <Panel layout={layout}>{match ? props.primary : props.secondary}</Panel>
  }

  return <DoublePanel {...props} />
}
