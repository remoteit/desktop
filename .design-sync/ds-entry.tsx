/**
 * Design-system entry for Claude Design.
 *
 * The desktop repo is an application, not a published component library — there
 * is no dist/ of components to point the converter at. This file IS the entry:
 * it re-exports the curated set of genuinely presentational components (no
 * redux store, no react-router, no i18next, no Capacitor) plus the app's real
 * MUI theme, so the bundle is built from the shipped source rather than a
 * reimplementation.
 *
 * Selection criteria and the full rationale live in .design-sync/NOTES.md.
 */
// MUST be first: some deps read Node's `global`. This is the app's own
// polyfill (window.global = window), which main.tsx imports the same way.
// ES imports evaluate in declaration order, so this has to stay at the top.
import '../frontend/src/polyfills'

import React from 'react'
import { Provider as ReduxProvider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { getTheme } from '../frontend/src/styling/theme'
import { designSystemStore } from './ds-store'

/**
 * The single wrapper every design needs.
 *
 * - MUI theme: components read palette/spacing/typography from context. Without
 *   it they render with stock MUI defaults — the wrong design system, and the
 *   failure is silent.
 * - Redux store: many components reach `useSelector`/`useDispatch` through a
 *   child (GridList → GridListHeader, Tags → Tag → useLabel, Icon →
 *   PlatformIcon). With no Provider, react-redux throws and React unmounts the
 *   whole subtree — a blank render with no visible error. The store is an inert
 *   stub; see ds-store.ts.
 * - Router: the list/row components render through `ListItemLocation`, which
 *   calls `useLocation()` and TypeErrors outside a Router. MemoryRouter is used
 *   rather than the app's HashRouter so nothing touches the URL.
 *
 * Nesting mirrors frontend/src/main.tsx (store outermost, router innermost).
 */
export const DesignSystemProvider: React.FC<{
  children?: React.ReactNode
  dark?: boolean
  /** Initial route, for components that highlight the active row. */
  route?: string
}> = ({ children, dark = false, route = '/devices' }) => (
  <ReduxProvider store={designSystemStore}>
    <ThemeProvider theme={getTheme(dark)}>
      <CssBaseline />
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    </ThemeProvider>
  </ReduxProvider>
)

/* --- Layout ------------------------------------------------------------- */
export { Container } from '../frontend/src/components/Container/Container'
export { Gutters } from '../frontend/src/components/Gutters'
export { Columns } from '../frontend/src/components/Columns/Columns'
export { GridList } from '../frontend/src/components/GridList'
export { GridListItem } from '../frontend/src/components/GridListItem'
export { GridListHeaderTitle } from '../frontend/src/components/GridListHeaderTitle'
export { ListHorizontal } from '../frontend/src/components/ListHorizontal'

/* --- Display ------------------------------------------------------------ */
export { Icon } from '../frontend/src/components/Icon'
export { Avatar } from '../frontend/src/components/Avatar/Avatar'
export { Notice } from '../frontend/src/components/Notice'
export { DataDisplay } from '../frontend/src/components/DataDisplay/DataDisplay'
export { Timestamp } from '../frontend/src/components/Timestamp'
export { Percent } from '../frontend/src/components/Percent'
export { Round } from '../frontend/src/components/Round'

/* --- Status & indicators ------------------------------------------------ */
export { ColorChip } from '../frontend/src/components/ColorChip'
export { LicenseChip } from '../frontend/src/components/LicenseChip'
export { ProductStatusChip } from '../frontend/src/components/ProductStatusChip'
export { ServiceMiniState } from '../frontend/src/components/ServiceMiniState'
export { JobStatusIcon } from '../frontend/src/components/JobStatusIcon'
export { PortScanIcon } from '../frontend/src/components/PortScanIcon'
export { LicensingIcon } from '../frontend/src/components/LicensingIcon'
export { ExpandIcon } from '../frontend/src/components/ExpandIcon'
export { ArrowIcon } from '../frontend/src/components/ArrowIcon'
export { ServiceLinkIcon } from '../frontend/src/components/ServiceLinkIcon'
export { EventIcon } from '../frontend/src/components/EventList/EventIcon'
export { EventTypeIconStack } from '../frontend/src/components/EventList/EventTypeIconStack'
export { InitiatorPlatform } from '../frontend/src/components/InitiatorPlatform'

/* --- Forms & settings --------------------------------------------------- */
export { ListItemSetting } from '../frontend/src/components/ListItemSetting/ListItemSetting'
export { ListItemCheckbox } from '../frontend/src/components/ListItemCheckbox/ListItemCheckbox'
export { ListItemSelect } from '../frontend/src/components/ListItemSelect'
export { SelectSetting } from '../frontend/src/components/SelectSetting'
export { InlineTextFieldSetting } from '../frontend/src/components/InlineTextFieldSetting'
export { InlineSelectSetting } from '../frontend/src/components/InlineSelectSetting/InlineSelectSetting'
export { QuantitySelector } from '../frontend/src/components/QuantitySelector'
export { TimeoutSetting } from '../frontend/src/components/TimeoutSetting'
export { FormDisplay } from '../frontend/src/components/FormDisplay'
export { DatePicker } from '../frontend/src/components/DatePicker/DatePicker'
export { TagAutocomplete } from '../frontend/src/components/TagAutocomplete'
export { Tags } from '../frontend/src/components/Tags'

/* --- Buttons ------------------------------------------------------------ */
export { DynamicButton } from '../frontend/src/buttons/DynamicButton'
export { DeleteButton } from '../frontend/src/buttons/DeleteButton'
export { ConfirmButton } from '../frontend/src/buttons/ConfirmButton'
export { ConfirmIconButton } from '../frontend/src/buttons/ConfirmIconButton'
export { ListItemButton } from '../frontend/src/buttons/ListItemButton'
export { ErrorButton } from '../frontend/src/buttons/ErrorButton/ErrorButton'
export { ShareButton } from '../frontend/src/buttons/ShareButton'

/* --- Data visualisation ------------------------------------------------- */
export { BarGraph } from '../frontend/src/components/BarGraph'
export { TimeSeries } from '../frontend/src/components/TimeSeries'
export { GraphColumn } from '../frontend/src/components/GraphColumn'

/* --- Feedback & composite ----------------------------------------------- */
export { LoadingMessage } from '../frontend/src/components/LoadingMessage/LoadingMessage'
export { LoadMore } from '../frontend/src/components/LoadMore/LoadMore'
export { PlanCard } from '../frontend/src/components/PlanCard'
export { ConnectionChecklist } from '../frontend/src/components/ConnectionChecklist'
export { SessionsTooltip } from '../frontend/src/components/SessionsTooltip/SessionsTooltip'
export { AgentAvatar } from '../frontend/src/components/ConnectedApps/AgentAvatar'
export { AgentListItem } from '../frontend/src/components/ConnectedApps/AgentListItem'
export { NetworkListTitle } from '../frontend/src/components/NetworkListTitle'
export { ConnectionName } from '../frontend/src/components/ConnectionName'
export { FilterSelector } from '../frontend/src/components/FilterSelector'
export { ResellerLogo } from '../frontend/src/components/ResellerLogo'
