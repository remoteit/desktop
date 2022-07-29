import React from 'react'
import { matchPathArray } from '../helpers/utilHelper'
import { useLocation } from 'react-router-dom'
import { DoublePanel } from './DoublePanel'
import { Panel } from './Panel'

type Props = {
  primary: React.ReactNode
  secondary?: React.ReactNode
  layout: ILayout
  root?: string | string[]
}

export const DynamicPanel: React.FC<Props> = ({ root, ...props }) => {
  const location = useLocation()
  const match = matchPathArray({ paths: root, end: true }, location.pathname)

  if (props.layout.singlePanel) {
    return <Panel layout={props.layout}>{match ? props.primary : props.secondary}</Panel>
  }

  return <DoublePanel {...props} />
}
