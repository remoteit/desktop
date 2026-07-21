import React, { useEffect } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Typography } from '@mui/material'
import { Dispatch, State } from '../../store'
import { Container } from '../../components/Container'
import { Title } from '../../components/Title'
import { IconButton } from '../../buttons/IconButton'
import { Gutters } from '../../components/Gutters'
import { LoadingMessage } from '../../components/LoadingMessage'
import { Notice } from '../../components/Notice'
import { spacing } from '../../styling'
import { AdminNoticeForm } from './AdminNoticeForm'

const LIST_ROUTE = '/admin/notices'

export const AdminNoticePage: React.FC = () => {
  const { noticeId } = useParams<{ noticeId?: string }>()
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const notices = useSelector((state: State) => state.adminNotices.notices)
  const saving = useSelector((state: State) => state.adminNotices.saving)
  const initialized = useSelector((state: State) => state.adminNotices.initialized)

  const isNew = noticeId === 'new'
  const notice = isNew ? undefined : notices.find(n => n.id === noticeId)

  // Deep linking straight to an edit URL has no list to read from yet.
  useEffect(() => {
    if (!initialized) dispatch.adminNotices.fetch()
  }, [initialized])

  const handleBack = () => history.push(LIST_ROUTE)

  const handleSave = async (input: INoticeInput) => {
    const saved = isNew
      ? await dispatch.adminNotices.create(input)
      : await dispatch.adminNotices.update({ id: noticeId as string, notice: input })
    if (saved) handleBack()
  }

  const header = (
    <Box>
      <Box
        sx={{
          height: 45,
          display: 'flex',
          alignItems: 'center',
          paddingX: `${spacing.md}px`,
          marginTop: `${spacing.sm}px`,
        }}
      >
        <IconButton icon="chevron-left" title="Back to Notices" onClick={handleBack} size="md" color="grayDarker" />
      </Box>
      <Typography variant="h2" sx={{ padding: 2 }}>
        <Title>{isNew ? 'New notice' : 'Edit notice'}</Title>
      </Typography>
    </Box>
  )

  if (!isNew && !notice)
    return initialized ? (
      <Container gutterBottom header={header}>
        <Gutters>
          <Notice severity="error" fullWidth>
            Notice not found
            <em>It may have been deleted by someone else.</em>
          </Notice>
        </Gutters>
      </Container>
    ) : (
      <LoadingMessage message="Loading notice..." />
    )

  return (
    <Container gutterBottom bodyProps={{ verticalOverflow: true }} header={header}>
      <AdminNoticeForm notice={notice} saving={saving} onCancel={handleBack} onSave={handleSave} />
    </Container>
  )
}
