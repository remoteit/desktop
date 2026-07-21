import React, { useState } from 'react'
import { Button, List, ListItem, MenuItem, TextField, Typography } from '@mui/material'
import { fieldSx } from '../../components/ServiceForm'
import { ListItemCheckbox } from '../../components/ListItemCheckbox'
import { Gutters } from '../../components/Gutters'
import { Notice } from '../../components/Notice'

const NOTICE_TYPES: INoticeType[] = ['GENERIC', 'SYSTEM', 'SECURITY', 'RELEASE', 'COMMUNICATION', 'BANNER']

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
  preview: notice?.preview || '',
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

  const isBanner = form.type === 'BANNER'
  const change = (values: Partial<INoticeInput>) => setForm(f => ({ ...f, ...values }))

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    // The API preserves explicit nulls (that is how you clear a field) but ignores undefined.
    // Send null rather than '' so cleared optional fields don't persist as empty strings.
    const blankToNull = (value?: string | null) => (value ? value : null)
    onSave({
      ...form,
      preview: blankToNull(form.preview),
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
            label="Subtitle"
            variant="filled"
            value={form.preview || ''}
            inputProps={{ maxLength: 255 }}
            onChange={e => change({ preview: e.target.value })}
          />
          <Typography variant="caption">
            {isBanner ? 'Smaller second line under the banner title. ' : 'Short summary shown under the title. '}
            <b>Leave blank for title only. Max 255 characters.</b>
          </Typography>
        </ListItem>

        {!isBanner && (
          <ListItem sx={fieldSx}>
            <TextField
              multiline
              minRows={4}
              label="Body"
              variant="filled"
              value={form.body || ''}
              onChange={e => change({ body: e.target.value })}
            />
            <Typography variant="caption">HTML shown on the announcement card. Not used by banners.</Typography>
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
          label={form.enabled ? 'Enabled' : 'Disabled'}
          subLabel={form.enabled ? 'Visible to users once the dates allow.' : 'Hidden from users.'}
          onClick={checked => change({ enabled: checked })}
        />
      </List>

      {isBanner && (
        <Gutters top={null}>
          <Typography variant="caption" color="textSecondary">
            BANNER PREVIEW
          </Typography>
          <Notice severity="warning" fullWidth solid sx={{ borderRadius: 0, marginTop: 0.5 }}>
            <strong>{form.title || 'Title'}</strong>
            {form.preview ? <em>{form.preview}</em> : null}
          </Notice>
        </Gutters>
      )}

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
