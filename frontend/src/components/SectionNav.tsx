import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { Box, Button, Menu, Tab, Typography } from '@mui/material'
import { PageTabs } from './PageTabs'
import { Icon } from './Icon'
import { ListItemLocation } from './ListItemLocation'
import { NAV_PAGES, NavPageId, VisibleSection, subNavShown } from '../helpers/navSections'
import { NAV_VARIANT, useSectionHome } from '../helpers/navVariant'
import { useNavSections } from '../hooks/useNavSections'
import { useCounts } from '../hooks/useCounts'
import { getLocale } from '../helpers/dateHelper'

/* A section's title and sub-links, heading the left panel wherever that panel shows one of the section's lists. */
export const SectionNav: React.FC<{ panels?: number }> = ({ panels = 1 }) => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const counts = useCounts()
  const nav = useNavSections()
  const sectionHome = useSectionHome()
  const { page, section } = nav

  if (nav.remoteUI || !page || !section || !subNavShown(page, pathname, panels) || sectionHome) return null

  if (NAV_VARIANT === 'c') return <TitleMenu section={section} page={page} open={nav.open} />

  if (NAV_VARIANT !== 'd')
    return (
      <Box sx={{ paddingX: 4.5, paddingTop: 0.5, marginBottom: 1, flexShrink: 0 }}>
        <Typography variant="h2" component="h1">
          {section.pages.length > 1 ? NAV_PAGES[page].label(t) : section.label(t)}
        </Typography>
      </Box>
    )

  return (
    <Box
      component="nav"
      aria-label={section.label(t)}
      sx={{ paddingX: 4.5, paddingTop: 0.5, marginBottom: 1, flexShrink: 0 }}
    >
      <Typography variant="h2" component="h1" sx={{ marginBottom: 0.75 }}>
        {section.label(t)}
      </Typography>
      <PageTabs value={page}>
        {section.pages.map(id => (
          <Tab
            key={id}
            value={id}
            label={
              id === 'connections' && counts.active ? (
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                  {NAV_PAGES[id].label(t)}
                  <Box component="span" sx={{ color: 'primary.main', fontWeight: 500 }}>
                    {counts.active.toLocaleString(getLocale())}
                  </Box>
                </Box>
              ) : (
                NAV_PAGES[id].label(t)
              )
            }
            onClick={() => nav.open(id)}
          />
        ))}
      </PageTabs>
    </Box>
  )
}

/* Option C: "Section / Page", the page part a menu of the section's pages. */
const TitleMenu: React.FC<{ section: VisibleSection; page: NavPageId; open: (id: NavPageId) => void }> = ({
  section,
  page,
  open,
}) => {
  const { t } = useTranslation()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const single = section.pages.length < 2

  return (
    <Box
      component="nav"
      aria-label={section.label(t)}
      sx={{ paddingX: 4.5, paddingTop: 0.5, marginBottom: 1, flexShrink: 0 }}
    >
      <Typography variant="h2" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
        {single ? (
          section.label(t)
        ) : (
          <>
            {section.label(t) !== NAV_PAGES[page].label(t) && (
              <>
                <Box component="span" sx={{ color: 'grayDark.main' }}>
                  {section.label(t)}
                </Box>
                <Box component="span" sx={{ color: 'grayLight.main', marginX: 1 }}>
                  /
                </Box>
              </>
            )}
            <Button
              onClick={event => setAnchor(event.currentTarget)}
              aria-haspopup="menu"
              aria-expanded={!!anchor}
              endIcon={<Icon name="chevron-down" size="sm" color="grayDark" />}
              sx={theme => ({
                font: 'inherit',
                letterSpacing: 'inherit',
                textTransform: 'none',
                color: theme.palette.black.main,
                marginLeft: -1,
                lineHeight: 'inherit',
                paddingX: 1,
                paddingY: 0,
                minWidth: 0,
                '& .MuiButton-endIcon': { marginLeft: 1 },
              })}
            >
              {NAV_PAGES[page].label(t)}
            </Button>
          </>
        )}
      </Typography>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        onClick={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {section.pages.map(id => (
          <ListItemLocation
            key={id}
            menuItem
            icon={NAV_PAGES[id].icon}
            title={NAV_PAGES[id].label(t)}
            onClick={() => open(id)}
            sx={id === page ? { backgroundColor: 'primaryLighter.main' } : undefined}
            dense
          />
        ))}
      </Menu>
    </Box>
  )
}
