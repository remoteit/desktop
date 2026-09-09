import { useSelector } from 'react-redux'
import { State } from '../store'

/* Is the app in its mobile layout?

   The width the APP has — the window minus the docked chat column — not the window
   itself. Asking the window directly is what let a component serve desktop density into
   a mobile-width area whenever the chat was open: the layout had already switched, and
   the component had not heard about it. Reading the published value keeps every
   consumer on the one answer, and re-renders only when the boolean flips.

   For anything INSIDE a panel, useContainerWidth is truer still — a list squeezed into
   a narrow panel is cramped even when the app overall is not mobile (see
   DevicesActionBar). Use this for chrome measured against the app area, and that when
   the element's own width is what actually matters. */
export const useMobile = (): boolean => useSelector((state: State) => state.ui.layout.mobile)
