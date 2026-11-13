import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Box, Button, Typography } from '@mui/material'
import { Dispatch } from '../store'
import { Avatar } from './Avatar'
import { Notice } from './Notice'
import { OidcResourceResult, oidcActor, oidcSetPicture } from '../services/oidc'
import { useAccountPicture } from '../hooks/useAccountPicture'
import { removeAccountPicture, setAccountPicture } from '../services/permitteerAccount'

const SIDE = 256
const MAX_BYTES = 64 * 1024

/** A square JPEG of the middle of the image, under the AS's 64 KB limit. Redrawing it also drops
 *  the file's metadata, such as where a phone photo was taken. */
export async function avatarDataUri(file: Blob): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = SIDE
  try {
    const context = canvas.getContext('2d')
    if (!context) throw new Error('no canvas')
    const crop = Math.min(bitmap.width, bitmap.height)
    context.fillStyle = '#fff'
    context.fillRect(0, 0, SIDE, SIDE)
    context.drawImage(bitmap, (bitmap.width - crop) / 2, (bitmap.height - crop) / 2, crop, crop, 0, 0, SIDE, SIDE)
  } finally {
    bitmap.close()
  }
  for (const quality of [0.85, 0.7, 0.5]) {
    const uri = canvas.toDataURL('image/jpeg', quality)
    if ((uri.length - uri.indexOf(',') - 1) * 0.75 <= MAX_BYTES) return uri
  }
  throw new Error('image too large')
}

export const ProfilePicture: React.FC<{ email: string }> = ({ email }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [unpermitted, setUnpermitted] = useState(false)
  const picture = useAccountPicture(email)
  const readOnly = !!oidcActor()

  const change = async (request: () => Promise<OidcResourceResult<{ picture?: string | null; error?: string }>>) => {
    setBusy(true)
    const result = await request().catch(() => undefined)
    setBusy(false)
    if (result?.status === 200) oidcSetPicture(result.body?.picture ?? null)
    else if (result?.body?.error === 'insufficient_authorization') setUnpermitted(true)
    else dispatch.ui.set({ errorMessage: t('settings.pictureError', 'Your picture could not be changed. Try again.') })
  }

  const upload = (file?: File) => file && change(async () => setAccountPicture(await avatarDataUri(file)))

  return (
    <>
      <Avatar email={email} size={125} />
      <Box>
        {readOnly || (
          <Box sx={{ display: 'flex', gap: 1, marginBottom: 1 }}>
            <Button variant="contained" size="small" disabled={busy} onClick={() => input.current?.click()}>
              {t('settings.uploadPicture', 'Upload picture')}
            </Button>
            {picture && (
              <Button size="small" disabled={busy} onClick={() => change(removeAccountPicture)}>
                {t('settings.removePicture', 'Remove')}
              </Button>
            )}
            <input
              ref={input}
              type="file"
              accept="image/*"
              hidden
              onChange={event => {
                upload(event.target.files?.[0])
                event.target.value = ''
              }}
            />
          </Box>
        )}
        {unpermitted && (
          <Box sx={{ marginBottom: 1 }}>
            <Notice severity="info" fullWidth>
              {t(
                'settings.picturePermission',
                'Changing your picture needs a permission your session doesn’t carry yet.'
              )}
            </Notice>
            <Button
              variant="contained"
              size="small"
              sx={{ marginTop: 1 }}
              onClick={() => dispatch.auth.healGrant({ force: true })}
            >
              {t('settings.refreshPermissions', 'Refresh permissions')}
            </Button>
          </Box>
        )}
        <Typography variant="caption">
          {t('settings.pictureVisible', 'Your picture is visible to others. Without one, your Gravatar is shown.')}
        </Typography>
      </Box>
    </>
  )
}
