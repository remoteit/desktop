import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Box, List, ListItem, ListItemText, ListSubheader, Typography } from '@mui/material'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import { Exit, OfferedExit, graphQLOfferedExits } from '../services/graphQLExits'
import { useAccountExits } from '../hooks/useAccountExits'
import { exitSummary, routedLine } from '../helpers/exitWords'
import { useDisabledDevicesAccess } from '../hooks/useDeviceDisable'
import { ListItemLocation } from '../components/ListItemLocation'
import { LoadingMessage } from '../components/LoadingMessage'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { NetworkSectionIntro } from '../components/NetworkSectionIntro'
import { Tags } from '../components/Tags'
import { Icon } from '../components/Icon'

/* Exits: your own first, each saying whether it is ready and which devices carry it; those shared with you; then
   Remote.It's, labelled as run by Remote.It. Each opens on its page (pages/ExitPage.tsx). */
export const ExitsPage: React.FC = () => {
  const { t } = useTranslation()
  const manage = useDisabledDevicesAccess()
  const { value: exits } = useAccountExits()
  const [remoteit, setRemoteit] = useState<OfferedExit[]>([])
  const [tagFilter, setTagFilter] = useState<ITag>()

  useEffect(() => {
    graphQLOfferedExits().then(offered =>
      setRemoteit(Array.isArray(offered) ? offered.filter(exit => exit.remoteit) : [])
    )
  }, [])

  const own = exits && typeof exits === 'object' ? exits.own : []
  const shown = tagFilter ? own.filter(exit => carries(exit, tagFilter)) : own

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <NetworkSectionIntro
          intro={t(
            'exitsPage.intro',
            'An exit sends a device’s internet traffic out through another device. Pick one under Route through.'
          )}
          action={manage ? t('exitsPage.create', 'Create exit') : undefined}
          to="/exits/new"
        />
      }
    >
      {exits === undefined ? (
        <LoadingMessage />
      ) : exits === UNSUPPORTED ? (
        <Notice gutterTop>{t('exitsPage.unsupported', 'Exits aren’t available on this server.')}</Notice>
      ) : exits === 'ERROR' ? (
        <Notice severity="error" gutterTop>
          {t('exitsPage.failed', 'Couldn’t load your exits. Try again.')}
        </Notice>
      ) : (
        <>
          <List>
            <ListSubheader>{t('exitsPage.own', 'Your exits')}</ListSubheader>
            {tagFilter && (
              <ListItem data-tag-filter={tagFilter.name}>
                <ListItemText
                  primary={t('exitsPage.tagFilter', 'Exits tagged')}
                  secondary={
                    !shown.length ? t('exitsPage.tagFilterNone', 'None of your exits has this tag.') : undefined
                  }
                />
                <Tags tags={[tagFilter]} onDelete={() => setTagFilter(undefined)} />
              </ListItem>
            )}
            {shown.map(exit => (
              <ListItemLocation
                key={exit.id}
                data-exit={exit.id}
                to={`/exits/${exit.id}`}
                match={`/exits/${exit.id}`}
                icon={<Icon name="door-open" size="md" color={exit.dormant ? 'grayDark' : 'primary'} fixedWidth />}
                title={exit.name}
                subtitle={ownLine(t, exit)}
              >
                {!!exit.tags.length && (
                  <Box display="flex" gap={0.5} onClick={event => event.stopPropagation()}>
                    <Tags tags={exit.tags} max={exit.tags.length} onClick={tag => setTagFilter(tag)} />
                  </Box>
                )}
              </ListItemLocation>
            ))}
            {!own.length && (
              <Gutters top="xs" bottom="sm">
                <Typography variant="body2" color="textSecondary" data-empty>
                  {t(
                    'exitsPage.none',
                    'No exits yet. Create one to send a device’s traffic out through another of your devices.'
                  )}
                </Typography>
              </Gutters>
            )}
          </List>
          {!!exits.shared.length && (
            <List>
              <ListSubheader>{t('exitsPage.shared', 'Shared with you')}</ListSubheader>
              {exits.shared.map(exit => (
                <ListItemLocation
                  key={exit.id}
                  data-shared={exit.id}
                  to={`/exits/${exit.id}`}
                  match={`/exits/${exit.id}`}
                  icon={<Icon name="door-open" size="md" color={exit.offered ? 'primary' : 'grayDark'} fixedWidth />}
                  title={exit.name}
                  subtitle={sharedLine(t, exit)}
                />
              ))}
            </List>
          )}
          {!!remoteit.length && (
            <List>
              <ListSubheader>{t('exitsPage.remoteit', 'Remote.It exits')}</ListSubheader>
              {remoteit.map(exit => (
                <ListItemLocation
                  key={exit.id}
                  data-remoteit={exit.id}
                  to={`/exits/${exit.id}`}
                  match={`/exits/${exit.id}`}
                  icon={<Icon name="globe" size="md" fixedWidth />}
                  title={exit.name}
                  subtitle={remoteitLine(t, exit)}
                />
              ))}
            </List>
          )}
        </>
      )}
    </Container>
  )
}

export const carries = (exit: Pick<Exit, 'tags'>, tag: ITag): boolean =>
  exit.tags.some(carried => carried.name.toLowerCase() === tag.name.toLowerCase())

export function ownLine(t: TFunction, exit: Exit): string {
  return [exitSummary(t, exit), routedLine(t, exit.users)].filter(Boolean).join(' · ')
}

export function sharedLine(t: TFunction, exit: Exit): string {
  const whose = exit.owner?.email ? t('exitsPage.sharedBy', 'Shared by {{email}}', { email: exit.owner.email }) : ''
  const ready = exit.offered ? t('carry.ready', 'Ready') : t('carry.notReadyShort', 'Not ready')
  return [ready, whose].filter(Boolean).join(' · ')
}

export function remoteitLine(t: TFunction, exit: Pick<OfferedExit, 'location' | 'provider'>): string {
  return [exit.location || exit.provider, t('exitsPage.runByRemoteit', 'Run by Remote.It')].filter(Boolean).join(' · ')
}
