import React, { useEffect } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'
import { Dispatch, State } from '../../store'
import { Container } from '../../components/Container'
import { Confirm } from '../../components/Confirm'
import { Title } from '../../components/Title'
import { IconButton } from '../../buttons/IconButton'
import { Gutters } from '../../components/Gutters'
import { LoadingMessage } from '../../components/LoadingMessage'
import { Notice } from '../../components/Notice'
import { spacing } from '../../styling'
import { AdminNoticeForm } from './AdminNoticeForm'

const LIST_ROUTE = '/admin/notices'

type Props = {
  // Only shown when the list panel is hidden — otherwise the list is already on screen and the
  // global header back button covers going up.
  showBackArrow?: boolean
}

export const AdminNoticeDetailPanel: React.FC<Props> = ({ showBackArrow }) => {
  const { t } = useTranslation()
  const { noticeId } = useParams<{ noticeId?: string }>()
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const notices = useSelector((state: State) => state.adminNotices.notices)
  const saving = useSelector((state: State) => state.adminNotices.saving)
  const initialized = useSelector((state: State) => state.adminNotices.initialized)
  const [removeOpen, setRemoveOpen] = React.useState(false)

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

  const handleRemove = async () => {
    setRemoveOpen(false)
    if (notice && (await dispatch.adminNotices.remove(notice.id))) handleBack()
  }

  const header = (
    <Box>
      {showBackArrow && (
        <Box
          sx={{
            height: 45,
            display: 'flex',
            alignItems: 'center',
            paddingX: `${spacing.md}px`,
            marginTop: `${spacing.sm}px`,
          }}
        >
          <IconButton
            icon="chevron-left"
            title={t('adminNoticeDetailPanel.backToNotices', 'Back to Notices')}
            onClick={handleBack}
            size="md"
            color="grayDarker"
          />
        </Box>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 2 }}>
        <Typography variant="h2" sx={{ padding: 2 }}>
          <Title>
            {isNew ? t('adminNoticeDetailPanel.newNotice', 'New notice') : t('adminNoticeDetailPanel.editNotice', 'Edit notice')}
          </Title>
        </Typography>
        {!isNew && notice && (
          <IconButton
            icon="trash"
            title={t('adminNoticeDetailPanel.deleteNotice', 'Delete notice')}
            onClick={() => setRemoveOpen(true)}
            size="md"
          />
        )}
      </Box>
    </Box>
  )

  if (!isNew && !notice)
    return initialized ? (
      <Container gutterBottom header={header}>
        <Gutters>
          <Notice severity="error" fullWidth>
            {t('adminNoticeDetailPanel.noticeNotFound', 'Notice not found')}
            <em>{t('adminNoticeDetailPanel.mayHaveBeenDeleted', 'It may have been deleted by someone else.')}</em>
          </Notice>
        </Gutters>
      </Container>
    ) : (
      <LoadingMessage message={t('adminNoticeDetailPanel.loadingNotice', 'Loading notice...')} />
    )

  return (
    <Container gutterBottom bodyProps={{ verticalOverflow: true }} header={header}>
      <AdminNoticeForm
        key={notice?.id || 'new'}
        notice={notice}
        saving={saving}
        onCancel={handleBack}
        onSave={handleSave}
      />
      <Confirm
        open={removeOpen}
        title={t('adminNoticeDetailPanel.deleteNoticeConfirm', 'Delete notice?')}
        onConfirm={handleRemove}
        onDeny={() => setRemoveOpen(false)}
        action={t('common.delete', 'Delete')}
        color="error"
      >
        <Typography variant="body2">
          {t('adminNoticeDetailPanel.permanentlyDeleted', {
            title: notice?.title,
            defaultValue: '"{{title}}" will be permanently deleted. This cannot be undone.',
          })}
        </Typography>
      </Confirm>
    </Container>
  )
}
