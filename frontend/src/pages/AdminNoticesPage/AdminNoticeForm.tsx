import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Button, List, ListItem, MenuItem, TextField, Typography } from '@mui/material'
import { fieldSx } from '../../components/ServiceForm'
import { ListItemCheckbox } from '../../components/ListItemCheckbox'
import { AnnouncementCard } from '../../components/AnnouncementCard'
import { Gutters } from '../../components/Gutters'
import { Notice } from '../../components/Notice'
import { bannerSeverity, isBannerType } from '../../helpers/noticeHelper'

const NOTICE_TYPES: INoticeType[] = [
  'GENERIC',
  'SYSTEM',
  'SECURITY',
  'RELEASE',
  'COMMUNICATION',
  'BANNER',
  'BANNER_WARN',
  'BANNER_DANGER',
]

// `datetime-local` needs `YYYY-MM-DDTHH:mm` in local time — toISOString() would shift to UTC.
const toInputValue = (date?: Date | string | null) => {
  if (!date) return ''
  const value = typeof date === 'string' ? new Date(date) : date
  const offset = value.getTimezoneOffset() * 60000
  return new Date(value.getTime() - offset).toISOString().slice(0, 16)
}

const fromInputValue = (value: string) => (value ? new Date(value).toISOString() : null)

const initialForm = (notice?: IAdminNotice): INoticeInput => ({
  type: notice?.type || 'BANNER',
  title: notice?.title || '',
  body: notice?.body || '',
  image: notice?.image || '',
  link: notice?.link || '',
  stage: notice?.stage || '',
  enabled: notice?.enabled ?? false,
  from: notice?.from ? notice.from.toISOString() : null,
  until: notice?.until ? notice.until.toISOString() : null,
})

type Props = {
  notice?: IAdminNotice
  saving?: boolean
  onCancel: () => void
  onSave: (notice: INoticeInput) => void
}

export const AdminNoticeForm: React.FC<Props> = ({ notice, saving, onCancel, onSave }) => {
  const { t } = useTranslation()
  const [form, setForm] = useState<INoticeInput>(() => initialForm(notice))

  const isBanner = isBannerType(form.type)
  const change = (values: Partial<INoticeInput>) => setForm(f => ({ ...f, ...values }))

  // Shape the in-progress form as an IAnnouncement so the real card component can render it.
  const previewAnnouncement: IAnnouncement = {
    id: 'preview',
    type: (form.type || 'GENERIC') as INoticeType,
    title: form.title || t('adminNoticeForm.titlePlaceholder', 'Title'),
    body: form.body || '',
    image: form.image || '',
    link: form.link || '',
    modified: new Date(),
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    // The API preserves explicit nulls (that is how you clear a field) but ignores undefined.
    // Send null rather than '' so cleared optional fields don't persist as empty strings.
    const blankToNull = (value?: string | null) => (value ? value : null)
    onSave({
      ...form,
      image: blankToNull(form.image),
      link: blankToNull(form.link),
      stage: blankToNull(form.stage),
      body: form.body || '',
    } as INoticeInput)
  }

  return (
    <form onSubmit={handleSubmit}>
      <List>
        <ListItem sx={fieldSx}>
          <TextField
            select
            label={t('adminNoticeForm.type', 'Type')}
            variant="filled"
            value={form.type || 'BANNER'}
            onChange={e => change({ type: e.target.value as INoticeType })}
          >
            {NOTICE_TYPES.map(type => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
          <Typography variant="caption">
            {isBanner ? (
              <>
                {t('adminNoticeForm.typeHelperBanner', 'Shown as a persistent bar at the top of the app.')}{' '}
                <b>{t('adminNoticeForm.bannersCannotBeDismissed', 'Banners cannot be dismissed.')}</b>
              </>
            ) : (
              t('adminNoticeForm.typeHelperCard', 'Shown as an announcement card.')
            )}
          </Typography>
        </ListItem>

        <ListItem sx={fieldSx}>
          <TextField
            required
            label={t('adminNoticeForm.title', 'Title')}
            variant="filled"
            value={form.title || ''}
            inputProps={{ maxLength: 255 }}
            onChange={e => change({ title: e.target.value })}
          />
          <Typography variant="caption">
            {isBanner
              ? t('adminNoticeForm.titleHelperBanner', 'Bold first line of the banner.')
              : t('adminNoticeForm.titleHelperCard', 'Notice heading.')}{' '}
            <b>{t('adminNoticeForm.requiredMax255', 'Required. Max 255 characters.')}</b>
          </Typography>
        </ListItem>

        <ListItem sx={fieldSx}>
          <TextField
            multiline
            minRows={isBanner ? 2 : 4}
            label={t('adminNoticeForm.body', 'Body')}
            variant="filled"
            value={form.body || ''}
            onChange={e => change({ body: e.target.value })}
          />
          <Typography variant="caption">
            {isBanner ? (
              <>
                {t('adminNoticeForm.bodyHelperBannerPre', 'Smaller second line under the banner title.')}{' '}
                <b>{t('adminNoticeForm.bodyHelperBannerBold', 'Keep it to a single short sentence')}</b>{' '}
                {t(
                  'adminNoticeForm.bodyHelperBannerPost',
                  '— it renders inline in a one-line bar, so long copy or block HTML will look wrong.'
                )}
              </>
            ) : (
              t('adminNoticeForm.bodyHelperCard', 'HTML shown on the announcement card.')
            )}
          </Typography>
        </ListItem>

        {!isBanner && (
          <ListItem sx={fieldSx}>
            <TextField
              label={t('adminNoticeForm.image', 'Image')}
              variant="filled"
              value={form.image || ''}
              inputProps={{ maxLength: 255 }}
              onChange={e => change({ image: e.target.value })}
            />
            <Typography variant="caption">
              {t(
                'adminNoticeForm.imageHelper',
                'URL of a banner image shown across the top of the announcement card. Not used by banners.'
              )}{' '}
              <b>{t('adminNoticeForm.max255Characters', 'Max 255 characters.')}</b>
            </Typography>
          </ListItem>
        )}

        <ListItem sx={fieldSx}>
          <TextField
            label={t('adminNoticeForm.link', 'Link')}
            variant="filled"
            value={form.link || ''}
            onChange={e => change({ link: e.target.value })}
          />
          <Typography variant="caption">
            {isBanner
              ? t('adminNoticeForm.linkHelperBanner', 'Adds a "Learn more" button to the banner.')
              : t('adminNoticeForm.linkHelperCard', 'Optional link.')}
          </Typography>
        </ListItem>

        <ListItem sx={fieldSx}>
          <TextField
            label={t('adminNoticeForm.stage', 'Stage')}
            variant="filled"
            value={form.stage || ''}
            onChange={e => change({ stage: e.target.value })}
          />
          <Typography variant="caption">
            {t(
              'adminNoticeForm.stageHelperPre',
              'Limit to one API deployment stage to test before going live. Must match the stage exactly — one of'
            )}{' '}
            <b>prod</b>, <b>beta</b>, <b>dev</b>,{' '}
            {t('adminNoticeForm.stageHelperMid', 'or a personal stage')} (<b>alt</b>, <b>benoit</b>, <b>evan</b>,{' '}
            <b>jamie</b>). <b>{t('adminNoticeForm.blankTargetsEveryStage', 'Blank targets every stage.')}</b>
          </Typography>
        </ListItem>

        <ListItem sx={fieldSx}>
          <TextField
            label={t('adminNoticeForm.from', 'From')}
            type="datetime-local"
            variant="filled"
            InputLabelProps={{ shrink: true }}
            value={toInputValue(form.from)}
            onChange={e => change({ from: fromInputValue(e.target.value) })}
          />
          <Typography variant="caption">
            {t('adminNoticeForm.fromHelper', 'When the notice starts showing. Blank shows it immediately.')}
          </Typography>
        </ListItem>

        <ListItem sx={fieldSx}>
          <TextField
            label={t('adminNoticeForm.until', 'Until')}
            type="datetime-local"
            variant="filled"
            InputLabelProps={{ shrink: true }}
            value={toInputValue(form.until)}
            onChange={e => change({ until: fromInputValue(e.target.value) })}
          />
          <Typography variant="caption">
            {t('adminNoticeForm.untilHelper', 'When the notice disappears.')}{' '}
            {isBanner && (
              <b>
                {t(
                  'adminNoticeForm.untilHelperBannerStrong',
                  'Strongly recommended — a banner cannot be dismissed by the user.'
                )}
              </b>
            )}
          </Typography>
        </ListItem>

        <ListItemCheckbox
          checked={!!form.enabled}
          label={t('adminNoticeForm.enableNotice', 'Enable notice')}
          subLabel={
            <>
              {t(
                'adminNoticeForm.enableNoticeHelper',
                'Disabling hides the notice from everyone, whatever the dates say.'
              )}
              &nbsp;
              <i>
                {form.enabled
                  ? t('adminNoticeForm.noticeIsEnabled', 'Notice is enabled')
                  : t('adminNoticeForm.noticeIsDisabled', 'Notice is disabled')}
              </i>
            </>
          }
          onClick={checked => change({ enabled: checked })}
        />
      </List>

      <Gutters top={null}>
        <Typography variant="caption" color="textSecondary">
          {isBanner
            ? t('adminNoticeForm.bannerPreview', 'BANNER PREVIEW')
            : t('adminNoticeForm.cardPreview', 'CARD PREVIEW')}
        </Typography>
        {isBanner ? (
          <Notice severity={bannerSeverity(form.type)} fullWidth solid sx={{ borderRadius: 0, marginTop: 0.5 }}>
            <strong>{form.title || t('adminNoticeForm.titlePlaceholder', 'Title')}</strong>
            {form.body ? <em dangerouslySetInnerHTML={{ __html: String(form.body) }} /> : null}
          </Notice>
        ) : (
          // Reuse the real card so the preview can't drift from what users actually see.
          // `hideMarkReadAction` suppresses the NEW button, which would otherwise mark a
          // fabricated preview id as read.
          <Box sx={{ marginTop: 0.5, '& .MuiCard-root': { marginLeft: 0, marginRight: 0 } }}>
            <AnnouncementCard data={previewAnnouncement} hideMarkReadAction />
          </Box>
        )}
      </Gutters>

      {isBanner && !form.until && (
        <Gutters top={null}>
          <Notice severity="warning" fullWidth>
            {t('adminNoticeForm.noEndDateSet', 'No end date set')}
            <em>
              {t(
                'adminNoticeForm.noEndDateSetDetail',
                'Without an "Until" date this banner stays up until someone disables it by hand.'
              )}
            </em>
          </Notice>
        </Gutters>
      )}

      <Gutters>
        <Button type="submit" variant="contained" color="primary" disabled={!form.title || saving}>
          {saving ? t('adminNoticeForm.saving', 'Saving...') : t('adminNoticeForm.save', 'Save')}
        </Button>
        <Button onClick={onCancel}>{t('adminNoticeForm.cancel', 'Cancel')}</Button>
      </Gutters>
    </form>
  )
}
