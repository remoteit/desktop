import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { List, ListItem, ListItemIcon, ListItemText, ListSubheader, Typography } from '@mui/material'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import { Exit, graphQLOfferedExits } from '../services/graphQLExits'
import { useAccountExits } from '../hooks/useAccountExits'
import { availabilityLabel, runsOnLine, usersLine } from '../helpers/runsHelper'
import { useDisabledDevicesAccess } from '../hooks/useDeviceDisable'
import { ListItemLocation } from '../components/ListItemLocation'
import { LoadingMessage } from '../components/LoadingMessage'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Tags } from '../components/Tags'
import { Icon } from '../components/Icon'

type Remoteit = Awaited<ReturnType<typeof graphQLOfferedExits>>

/* Exits (graphql-api docs/PROXY-GROUPS.md §13): what a device sends its traffic out through, run by devices. The
   account's own — each with the devices it runs on, the devices using it, and no device available when none of its
   devices is in service —, those other accounts share with you, and remote.it's, offered by plan. An own exit or one
   shared with you opens on its page (pages/ExitPage.tsx); a tag clicked shows only the exits carrying it. New exit
   makes one, then its devices are added (pages/ExitAddPage.tsx). Behind the device-sessions flag. */
export const ExitsPage: React.FC = () => {
  const { t } = useTranslation()
  const manage = useDisabledDevicesAccess()
  const { value: exits } = useAccountExits()
  const [remoteit, setRemoteit] = useState<Exclude<Remoteit, 'ERROR' | typeof UNSUPPORTED>>([])
  const [tagFilter, setTagFilter] = useState<ITag>()

  // remote.it's, offered by plan: the exits offered to you that are remote.it's.
  useEffect(() => {
    graphQLOfferedExits().then(offered => setRemoteit(Array.isArray(offered) ? offered.filter(exit => exit.remoteit) : []))
  }, [])

  const own = exits && typeof exits === 'object' ? exits.own : []
  const shown = tagFilter ? own.filter(exit => carries(exit, tagFilter)) : own

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <Typography variant="subtitle1">
            <Title>{t('exitsPage.title', 'Exits')}</Title>
            {manage && <IconButton icon="plus" title={t('exitsPage.new', 'New exit')} to="/exits/new" size="md" />}
          </Typography>
          <Gutters top={null} bottom="sm">
            <Typography variant="body2" color="textSecondary">
              {t(
                'exitsPage.description',
                'A device sends its traffic out through an exit, as through a VPN. An exit runs on devices: make one, then add the devices that run it.'
              )}
            </Typography>
          </Gutters>
        </>
      }
    >
      {exits === undefined ? (
        <LoadingMessage />
      ) : exits === UNSUPPORTED ? (
        <Notice gutterTop>{t('exitsPage.unsupported', 'This server does not have exits.')}</Notice>
      ) : exits === 'ERROR' ? (
        <Notice severity="error" gutterTop>
          {t('exitsPage.failed', 'The exits could not be read.')}
        </Notice>
      ) : (
        <>
          <List>
            <ListSubheader>{t('exitsPage.own', 'Yours')}</ListSubheader>
            {tagFilter && (
              <ListItem data-tag-filter={tagFilter.name}>
                <ListItemText
                  primary={t('exitsPage.tagFilter', 'Exits tagged')}
                  secondary={!shown.length ? t('exitsPage.tagFilterNone', 'None of your exits carries it.') : undefined}
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
                {!!exit.tags.length && <Tags tags={exit.tags} max={exit.tags.length} onClick={tag => setTagFilter(tag)} />}
              </ListItemLocation>
            ))}
            {!own.length && (
              <ListItem>
                <ListItemText
                  secondary={t('exitsPage.none', 'None yet: make an exit, then add the devices that run it.')}
                />
              </ListItem>
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
              <ListSubheader>{t('exitsPage.remoteit', 'remote.it’s')}</ListSubheader>
              {remoteit.map(exit => (
                <ListItem key={exit.id} data-remoteit={exit.id}>
                  <ListItemIcon>
                    <Icon name="globe" size="md" fixedWidth />
                  </ListItemIcon>
                  <ListItemText primary={exit.name} secondary={exit.provider || exit.location} />
                </ListItem>
              ))}
            </List>
          )}
        </>
      )}
    </Container>
  )
}

// Whether an exit carries a tag, by name case aside, as graphql compares tag names.
export const carries = (exit: Pick<Exit, 'tags'>, tag: ITag): boolean =>
  exit.tags.some(carried => carried.name.toLowerCase() === tag.name.toLowerCase())

// One of yours, in a line: the devices it runs on, the devices using it, and no device available when so.
export function ownLine(t: TFunction, exit: Exit): string {
  return [runsOnLine(t, exit.devices), usersLine(t, exit.users), availabilityLabel(t, exit)]
    .filter(Boolean)
    .join(' · ')
}

// One shared with you, in a line: whose it is, and whether a device of yours may choose it now.
export function sharedLine(t: TFunction, exit: Exit): string {
  const whose = exit.owner?.email ? t('exitsPage.sharedBy', 'Shared by {{email}}', { email: exit.owner.email }) : ''
  const now = exit.offered ? t('exitsPage.sharedOffered', 'A device of yours may use it') : availabilityLabel(t, exit)
  return [whose, now].filter(Boolean).join(' · ')
}
