import React from 'react'
import { useLocation, matchPath } from 'react-router-dom'
import { TriplePanel } from './TriplePanel'
import { DoublePanel } from './DoublePanel'
import { Panel } from './Panel'

type Props = {
  primary: React.ReactNode
  secondary?: React.ReactNode
  tertiary?: React.ReactNode
  layout: ILayout
  root?: string | string[]
  subRoot?: string | string[]
  header?: boolean
}

export const DynamicPanel: React.FC<Props> = ({ root, subRoot, header = true, ...props }) => {
  const location = useLocation()
  const rootMatch = matchPath(location.pathname, { path: root, exact: true })
  const subRootMatch = subRoot ? matchPath(location.pathname, { path: subRoot }) : null

  if (props.layout.singlePanel || !props.secondary) {
    // Single panel: at root show secondary (detail), otherwise show deepest active content
    if (rootMatch && props.secondary) return <Panel layout={props.layout} header={header}>{props.secondary}</Panel>
    if (subRootMatch && props.tertiary) return <Panel layout={props.layout} header={header}>{props.tertiary}</Panel>
    return <Panel layout={props.layout} header={header}>{props.secondary}</Panel>
  }

  // Triple panel: show all three when layout supports it and tertiary content is active
  if (props.layout.triplePanel && props.tertiary && subRootMatch) {
    return <TriplePanel header={header} primary={props.primary} secondary={props.secondary} tertiary={props.tertiary} layout={props.layout} />
  }

  // Double panel: choose the two most relevant panels
  if (subRootMatch && props.tertiary) {
    // Deep navigation: show secondary + tertiary
    return <DoublePanel header={header} primary={props.secondary} secondary={props.tertiary} layout={props.layout} />
  }

  // Default: show primary + secondary
  return <DoublePanel header={header} primary={props.primary} secondary={props.secondary} layout={props.layout} />
}
