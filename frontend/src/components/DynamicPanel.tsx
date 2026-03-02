import React from 'react'
import { useLocation, matchPath } from 'react-router-dom'
import { TriplePanel } from './TriplePanel'
import { DoublePanel } from './DoublePanel'
import { Panel } from './Panel'

// Layout by panel count:
//   1 panel:  primary (at root) or secondary (deeper)
//   2 panels: primary (left) + secondary (right)
//   3 panels: tertiary (left) + primary (center) + secondary (right)

type Props = {
  primary: React.ReactNode
  secondary?: React.ReactNode
  tertiary?: React.ReactNode
  layout: ILayout
  root?: string  // single panel: show primary when pathname matches this exactly, secondary otherwise
  header?: boolean
}

export const DynamicPanel: React.FC<Props> = ({ primary, secondary, tertiary, layout, root, header = true }) => {
  const location = useLocation()

  if (layout.singlePanel) {
    const atRoot = root ? !!matchPath(location.pathname, { path: root, exact: true }) : !secondary
    if (!atRoot && secondary) return <Panel layout={layout} header={header}>{secondary}</Panel>
    return <Panel layout={layout} header={header}>{primary}</Panel>
  }

  if (layout.triplePanel && tertiary && secondary) {
    return <TriplePanel header={header} left={tertiary} center={primary} right={secondary} layout={layout} />
  }

  if (secondary) {
    return <DoublePanel header={header} left={primary} right={secondary} layout={layout} />
  }

  return <Panel layout={layout} header={header}>{primary}</Panel>
}
