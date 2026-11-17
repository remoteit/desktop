import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { Button, InputAdornment, List, TextField, Typography } from '@mui/material'
import { State } from '../store'
import { selectActiveAccountId } from '../selectors/accounts'
import { CatalogApp, CatalogRead, graphQLAppCatalog, UNSERVED } from '../services/graphQLAppCatalog'
import { AppCatalogRow } from '../components/AppCatalogRow'
import { LoadingMessage } from '../components/LoadingMessage'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'
import { platformsLine } from '../helpers/appsHelper'

/* Apps (presence-server docs/device-apps-design.md, "The Apps pages", /apps): the account's catalogue — every app it may
   use (graphql's appCatalog: remote.it's, its own publisher's) —, one row an app: its name, its publisher with
   Verified: <domain> and Yours for the account's own, Runs as root or Restricted, its platforms as families, its
   description, and how many of the account's devices have it. A row opens the app (/apps/:appID); Add… opens Add
   (/apps/:appID/add). An app with no release on this stage says "No release here yet", and cannot be added. */
export const AppsPage: React.FC = () => {
  const { t } = useTranslation()
  const history = useHistory()
  const accountId = useSelector((state: State) => selectActiveAccountId(state))
  const userId = useSelector((state: State) => state.user.id)
  const account = accountId && accountId !== userId ? accountId : undefined
  const [apps, setApps] = useState<CatalogRead<CatalogApp[]>>()
  const [search, setSearch] = useState('')

  useEffect(() => {
    let current = true
    setApps(undefined)
    graphQLAppCatalog(account).then(answer => current && setApps(answer))
    return () => {
      current = false
    }
  }, [account])

  const words = search.trim().toLowerCase()
  const shown = Array.isArray(apps)
    ? apps.filter(
        app =>
          !words ||
          [app.id, app.name, app.publisher.name, app.description ?? ''].some(text => text.toLowerCase().includes(words))
      )
    : []

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <Typography variant="h1">
            <Title>{t('apps.title', 'Apps')}</Title>
          </Typography>
          <Gutters top={null} bottom="sm">
            <TextField
              size="small"
              variant="standard"
              fullWidth
              value={search}
              placeholder={t('apps.search', 'Search apps')}
              onChange={event => setSearch(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Icon name="search" size="sm" />
                  </InputAdornment>
                ),
              }}
              inputProps={{ 'data-apps-search': true }}
            />
          </Gutters>
        </>
      }
    >
      {apps === undefined ? (
        <LoadingMessage />
      ) : apps === UNSERVED ? (
        <Notice gutterTop>{t('apps.catalogUnserved', 'This server does not have the app catalogue yet.')}</Notice>
      ) : apps === 'ERROR' ? (
        <Notice severity="error" gutterTop>
          {t('apps.catalogFailed', 'The apps could not be read.')}
        </Notice>
      ) : !shown.length ? (
        <Gutters>
          <Typography variant="body2" color="textSecondary" data-apps-empty>
            {apps.length ? t('apps.noMatch', 'No app matches.') : t('apps.none', 'No app is offered to this account yet.')}
          </Typography>
        </Gutters>
      ) : (
        <List data-apps>
          {shown.map(app => {
            const devices = app.fleet.total
            return (
              <AppCatalogRow
                key={app.id}
                id={app.id}
                name={app.name}
                publisher={app.publisher.name}
                verifiedDomain={app.publisher.verifiedDomain}
                own={app.publisher.own}
                root={app.root}
                capabilities={app.capabilities}
                protocol={app.protocol}
                description={app.description}
                platforms={app.version ? platformsLine(t, app.platforms) : t('apps.noRelease', 'No release here yet')}
                aside={
                  devices
                    ? t('apps.deviceCount', { count: devices, defaultValue_one: '{{count}} device', defaultValue_other: '{{count}} devices' })
                    : '—'
                }
                onOpen={() => history.push(`/apps/${app.id}`)}
                action={
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={!app.version}
                    onClick={() => history.push(`/apps/${app.id}/add`)}
                    data-apps-add={app.id}
                  >
                    {t('apps.addEllipsis', 'Add…')}
                  </Button>
                }
              />
            )
          })}
        </List>
      )}
    </Container>
  )
}
