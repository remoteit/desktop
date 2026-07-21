import React, { useEffect } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../../store'
import { Gutters } from '../../components/Gutters'
import { ListItemBack } from '../../components/ListItemBack'
import { LoadingMessage } from '../../components/LoadingMessage'
import { Notice } from '../../components/Notice'
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

  const handleSave = async (input: INoticeInput) => {
    const saved = isNew
      ? await dispatch.adminNotices.create(input)
      : await dispatch.adminNotices.update({ id: noticeId as string, notice: input })
    if (saved) history.push(LIST_ROUTE)
  }

  if (!isNew && !notice)
    return initialized ? (
      <Gutters size="md">
        <ListItemBack title="Notices" to={LIST_ROUTE} />
        <Notice severity="error" fullWidth gutterTop>
          Notice not found
          <em>It may have been deleted by someone else.</em>
        </Notice>
      </Gutters>
    ) : (
      <LoadingMessage message="Loading notice..." />
    )

  return (
    <Gutters size="md" bottom={null}>
      <ListItemBack title={isNew ? 'New notice' : 'Edit notice'} to={LIST_ROUTE} />
      <AdminNoticeForm
        notice={notice}
        saving={saving}
        onCancel={() => history.push(LIST_ROUTE)}
        onSave={handleSave}
      />
    </Gutters>
  )
}
