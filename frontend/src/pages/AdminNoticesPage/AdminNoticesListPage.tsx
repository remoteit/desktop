import React, { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Button, Stack, Typography } from '@mui/material'
import { Dispatch, State } from '../../store'
import { Container } from '../../components/Container'
import { GridList } from '../../components/GridList'
import { GridListItem } from '../../components/GridListItem'
import { Gutters } from '../../components/Gutters'
import { Icon } from '../../components/Icon'
import { LoadingMessage } from '../../components/LoadingMessage'
import { Notice } from '../../components/Notice'
import { adminNoticeAttributes, noticeIcon, noticeStatus, sortNotices } from './adminNoticeAttributes'

export const AdminNoticesListPage: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const location = useLocation()
  const notices = useSelector((state: State) => state.adminNotices.notices)
  const loading = useSelector((state: State) => state.adminNotices.loading)
  const initialized = useSelector((state: State) => state.adminNotices.initialized)
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)

  useEffect(() => {
    dispatch.adminNotices.fetch()
  }, [])

  const sorted = useMemo(() => sortNotices(notices), [notices])

  const required = adminNoticeAttributes.find(a => a.required)
  const attributes = adminNoticeAttributes.filter(a => !a.required)

  if (loading && !initialized)
    return <LoadingMessage message={t('adminNoticesListPage.loading', 'Loading notices...')} />

  return (
    <Container
      integrated
      gutterBottom
      bodyProps={{ verticalOverflow: true, horizontalOverflow: true }}
      header={
        <Gutters>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Typography variant="h2">{t('adminNoticesListPage.title', 'Notices')}</Typography>
            <Button variant="contained" size="small" onClick={() => history.push('/admin/notices/new')}>
              {t('adminNoticesListPage.newNotice', 'New notice')}
            </Button>
          </Stack>
        </Gutters>
      }
    >
      {!sorted.length ? (
        <Gutters>
          <Notice severity="info" fullWidth>
            {t('adminNoticesListPage.noNotices', 'No notices yet')}
            <em>
              {t('adminNoticesListPage.noNoticesHint', 'Create one to announce maintenance, an outage, or a release.')}
            </em>
          </Notice>
        </Gutters>
      ) : (
        <GridList attributes={attributes} required={required} columnWidths={columnWidths} fetching={loading}>
          {sorted.map(notice => (
            <GridListItem
              key={notice.id}
              onClick={() => history.push(`/admin/notices/${notice.id}`)}
              selected={location.pathname.includes(`/admin/notices/${notice.id}`)}
              disableGutters
              icon={
                <Icon
                  name={noticeIcon(notice.type)}
                  size="md"
                  color={noticeStatus(notice) === 'Live' ? 'primary' : 'grayDark'}
                />
              }
              required={required?.value({ notice })}
            >
              {attributes.map(attribute => (
                <Box key={attribute.id} className="attribute">
                  <Box
                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}
                  >
                    {attribute.value({ notice })}
                  </Box>
                </Box>
              ))}
            </GridListItem>
          ))}
        </GridList>
      )}
    </Container>
  )
}
