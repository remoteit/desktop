import React from 'react'
import { useLocation, matchPath } from 'react-router-dom'
import { DoublePanel } from './DoublePanel'
import { Panel } from './Panel'

type Props = {
  primary: React.ReactNode
  secondary?: React.ReactNode
  layout: ILayout
  root?: string | string[]
  header?: boolean
}

export const DynamicPanel: React.FC<Props> = ({ root, header = true, ...props }) => {
  const location = useLocation()
  const match = matchPath(location.pathname, { path: root, exact: true })

  if (props.layout.singlePanel || !props.secondary) {
    return <Panel layout={props.layout} header={header}>{match ? props.primary : props.secondary}</Panel>
  }

  return <DoublePanel header={header} {...props} />
}
