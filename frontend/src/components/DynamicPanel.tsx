import React from 'react'
import { useLocation, matchPath } from 'react-router-dom'
import { Breadcrumbs } from './Breadcrumbs'
import { DoublePanel } from './DoublePanel'
import { Panel } from './Panel'

type Props = {
  primary: React.ReactElement
  secondary?: React.ReactElement
  resize?: 'devices' | 'connections'
  single?: boolean
  root?: string | string[]
}

export const DynamicPanel: React.FC<Props> = ({ single, root, ...props }) => {
  const location = useLocation()
  const match = matchPath(location.pathname, { path: root, exact: true })

  if (single) {
    return (
      <Panel>
        <Breadcrumbs />
        {match ? props.primary : props.secondary}
      </Panel>
    )
  }

  return <DoublePanel {...props} />
}
