import React from 'react'
import { useLocation } from 'react-router-dom'
import { REGEX_FIRST_PATH } from '../shared/constants'
import { Breadcrumbs } from './Breadcrumbs'
import { DoublePanel } from './DoublePanel'
import { Panel } from './Panel'

type Props = {
  primary: React.ReactElement
  secondary?: React.ReactElement
  resize?: 'devices' | 'connections'
  single?: boolean
}

export const DynamicPanel: React.FC<Props> = ({ single, ...props }) => {
  const location = useLocation()
  const match = location.pathname.match(REGEX_FIRST_PATH)
  const isRootPath = match && match[0] === location.pathname

  if (single) {
    return (
      <Panel>
        <Breadcrumbs />
        {isRootPath ? props.primary : props.secondary}
      </Panel>
    )
  }

  return <DoublePanel {...props} />
}
