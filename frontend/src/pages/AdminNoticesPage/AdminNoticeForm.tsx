import React, { useState } from 'react'
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
  const [form, setForm] = useState<INoticeInput>(() => initialForm(notice))

  const isBanner = isBannerType(form.type)
  const change = (values: Partial<INoticeInput>) => setForm(f => ({ ...f, ...values }))

  // Shape the in-progress form as an IAnnouncement so the real card component can render it.
  const previewAnnouncement: IAnnouncement = {
    id: 'preview',
    type: (form.type || 'GENERIC') as INoticeType,
    title: form.title || 'Title',
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
            label="Type"
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
                Shown as a persistent bar at the top of the app. <b>Banners cannot be dismissed.</b>
              </>
            ) : (
              'Shown as an announcement card.'
            )}
          </Typography>
        </ListItem>

        <ListItem sx={fieldSx}>
          <TextField
            required
            label="Title"
            variant="filled"
            value={form.title || ''}
            inputProps={{ maxLength: 255 }}
            onChange={e => change({ title: e.target.value })}
          />
          <Typography variant="caption">
            {isBanner ? 'Bold first line of the banner.' : 'Notice heading.'} <b>Required. Max 255 characters.</b>
          </Typography>
        </ListItem>

        <ListItem sx={fieldSx}>
          <TextField
            multiline
            minRows={isBanner ? 2 : 4}
            label="Body"
            variant="filled"
            value={form.body || ''}
            onChange={e => change({ body: e.target.value })}
          />
          <Typography variant="caption">
            {isBanner ? (
              <>
                Smaller second line under the banner title. <b>Keep it to a single short sentence</b> — it renders
                inline in a one-line bar, so long copy or block HTML will look wrong.
              </>
            ) : (
              'HTML shown on the announcement card.'
            )}
          </Typography>
        </ListItem>

        {!isBanner && (
          <ListItem sx={fieldSx}>
            <TextField
              label="Image"
              variant="filled"
              value={form.image || ''}
              inputProps={{ maxLength: 255 }}
              onChange={e => change({ image: e.target.value })}
            />
            <Typography variant="caption">
              URL of a banner image shown across the top of the announcement card. Not used by banners.{' '}
              <b>Max 255 characters.</b>
            </Typography>
          </ListItem>
        )}

        <ListItem sx={fieldSx}>
          <TextField
            label="Link"
            variant="filled"
            value={form.link || ''}
            onChange={e => change({ link: e.target.value })}
          />
          <Typography variant="caption">
            {isBanner ? 'Adds a "Learn more" button to the banner.' : 'Optional link.'}
          </Typography>
        </ListItem>

        <ListItem sx={fieldSx}>
          <TextField
            label="Stage"
            variant="filled"
            value={form.stage || ''}
            onChange={e => change({ stage: e.target.value })}
          />
          <Typography variant="caption">
            Limit to one API deployment stage to test before going live. Must match the stage exactly — one of{' '}
            <b>prod</b>, <b>beta</b>, <b>dev</b>, or a personal stage (<b>alt</b>, <b>benoit</b>, <b>evan</b>,{' '}
            <b>jamie</b>). <b>Blank targets every stage.</b>
          </Typography>
        </ListItem>

        <ListItem sx={fieldSx}>
          <TextField
            label="From"
            type="datetime-local"
            variant="filled"
            InputLabelProps={{ shrink: true }}
            value={toInputValue(form.from)}
            onChange={e => change({ from: fromInputValue(e.target.value) })}
          />
          <Typography variant="caption">When the notice starts showing. Blank shows it immediately.</Typography>
        </ListItem>

        <ListItem sx={fieldSx}>
          <TextField
            label="Until"
            type="datetime-local"
            variant="filled"
            InputLabelProps={{ shrink: true }}
            value={toInputValue(form.until)}
            onChange={e => change({ until: fromInputValue(e.target.value) })}
          />
          <Typography variant="caption">
            When the notice disappears.{' '}
            {isBanner && <b>Strongly recommended — a banner cannot be dismissed by the user.</b>}
          </Typography>
        </ListItem>

        <ListItemCheckbox
          checked={!!form.enabled}
          label="Enable notice"
          subLabel={
            <>
              Disabling hides the notice from everyone, whatever the dates say.&nbsp;
              <i>Notice is{form.enabled ? ' enabled' : ' disabled'}</i>
            </>
          }
          onClick={checked => change({ enabled: checked })}
        />
      </List>

      <Gutters top={null}>
        <Typography variant="caption" color="textSecondary">
          {isBanner ? 'BANNER PREVIEW' : 'CARD PREVIEW'}
        </Typography>
        {isBanner ? (
          <Notice severity={bannerSeverity(form.type)} fullWidth solid sx={{ borderRadius: 0, marginTop: 0.5 }}>
            <strong>{form.title || 'Title'}</strong>
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
            No end date set
            <em>Without an "Until" date this banner stays up until someone disables it by hand.</em>
          </Notice>
        </Gutters>
      )}

      <Gutters>
        <Button type="submit" variant="contained" color="primary" disabled={!form.title || saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
      </Gutters>
    </form>
  )
}
