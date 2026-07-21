// TEMPORARY design-review harness for AnnouncementBanner — delete before committing.
import './polyfills'
import React from 'react'
import { store, persistor } from './store'
import { createRoot } from 'react-dom/client'
import { Box, Button, CssBaseline, Typography } from '@mui/material'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { Layout } from './components/Layout'
import { AnnouncementBanner } from './components/AnnouncementBanner'
import { MemoryRouter, Route } from 'react-router-dom'
import { AdminNoticesPage } from './pages/AdminNoticesPage/AdminNoticesPage'
import { Panel } from './components/Panel'
import { Dispatch, State } from './store'
import './initializeCommon'

const now = Date.now()
const hours = (n: number) => new Date(now + n * 60 * 60 * 1000)

const banners: IAnnouncement[] = [
  {
    id: 'banner-outage',
    type: 'BANNER',
    title: 'Service disruption',
    body: 'Connections may fail to start. We are investigating.',
    image: '',
    link: 'https://status.remote.it',
    modified: hours(-1),
    until: hours(4),
  },
  {
    id: 'banner-maintenance',
    type: 'BANNER',
    title: 'Scheduled maintenance Saturday 02:00–04:00 UTC',
    body: 'Device connections will be briefly interrupted. No action is required.',
    image: '',
    link: '',
    modified: hours(-2),
    until: hours(48),
  },
  {
    id: 'banner-plain',
    type: 'BANNER',
    title: 'Title only — no preview set, so no subtitle line',
    body: '',
    image: '',
    link: '',
    modified: hours(-3),
    until: hours(8),
  },
  {
    // Expired: proves the client-side `until` check hides it even though it is in the store
    id: 'banner-expired',
    type: 'BANNER',
    title: 'EXPIRED — should never render',
    body: '',
    image: '',
    link: '',
    modified: hours(-72),
    until: hours(-1),
  },
]

// Seed once now, then AGAIN after redux-persist finishes rehydrating. Rehydration is async and
// overwrites the announcements slice wholesale, so a browser with real persisted state (i.e. one
// that has actually used the local app) would otherwise clobber these mocks and render nothing.
const adminNotices: IAdminNotice[] = [
  { id: 'n1', type: 'BANNER', title: 'Service disruption', body: 'Connections may fail to start.',
    enabled: true, from: hours(-1), until: hours(4), modified: hours(-1) },
  { id: 'n2', type: 'BANNER', title: 'Scheduled maintenance', body: 'Brief interruption expected.',
    enabled: true, from: hours(24), until: hours(28), modified: hours(-2) },
  { id: 'n3', type: 'BANNER', title: 'Banner with no end date', body: '', enabled: true, modified: hours(-3) },
  { id: 'n4', type: 'SYSTEM', title: 'Old release note',
    enabled: true, until: hours(-2), modified: hours(-72), stage: 'jamie',
    image: 'https://placehold.co/600x150/0096e7/fff?text=Notice+Image',
    body: '<p>Full <b>HTML</b> body copy for the card.</p>' },
  { id: 'n5', type: 'COMMUNICATION', title: 'Draft announcement', body: '', enabled: false, modified: hours(-5) },
]

const seed = () => {
  store.dispatch.announcements.set({ all: banners })
  store.dispatch.adminNotices.set({ notices: adminNotices, initialized: true, loading: false })
}

seed()

if (persistor.getState().bootstrapped) seed()
else {
  const unsubscribe = persistor.subscribe(() => {
    if (!persistor.getState().bootstrapped) return
    seed()
    unsubscribe()
  })
}

const PanelWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const layout = useSelector((state: State) => state.ui.layout)
  return <Panel layout={layout}>{children}</Panel>
}

const Diagnostics: React.FC = () => {
  const all = useSelector((state: State) => state.announcements.all)
  const bannerCount = all.filter(a => a.type === 'BANNER').length
  return (
    <Typography variant="body2" color="textSecondary" gutterBottom>
      store.announcements.all = {all.length} — of which BANNER = {bannerCount} (expect 4, one expired &rarr; 3 render)
    </Typography>
  )
}

const ThemeToggle: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  return (
    <Button variant="outlined" size="small" onClick={() => dispatch.ui.setTheme('dark')} sx={{ marginRight: 1 }}>
      Dark
    </Button>
  )
}

const LightToggle: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  return (
    <Button variant="outlined" size="small" onClick={() => dispatch.ui.setTheme('light')}>
      Light
    </Button>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(
  <Provider store={store}>
    <Layout>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
        <AnnouncementBanner />
        <Box sx={{ height: 700, display: 'flex' }}>
          <MemoryRouter initialEntries={['/admin/notices/n4']}>
            <PanelWrapper>
              <Route path="/admin/notices/:noticeId?">
                <AdminNoticesPage />
              </Route>
            </PanelWrapper>
          </MemoryRouter>
        </Box>
        <Box sx={{ padding: 3 }}>
          <Typography variant="h2" gutterBottom>
            Page content below the banner
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Three banners should render (outage w/ link, maintenance, plain title). The fourth is expired and must not
            appear.
          </Typography>
          <Diagnostics />
          <Box sx={{ marginTop: 2 }}>
            <ThemeToggle />
            <LightToggle />
          </Box>
        </Box>
      </Box>
    </Layout>
  </Provider>
)
