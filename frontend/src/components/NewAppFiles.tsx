import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Button, Checkbox, FormControlLabel, MenuItem, TextField, Typography } from '@mui/material'
import { Gutters } from './Gutters'
import { Given, offeredPlatforms } from '../helpers/appRelease'

/* New app's files (presence-server docs/device-apps-new-app.md, "Files and packaging"): the platforms the app is built
   for, and for each what to pack — the program alone, a folder, or a .tar.gz of its files. Only platforms whose OS the
   manifest runs something on are offered (and `any`, one archive for every platform). The files stay in the page until
   they are packed. */

export type Inputs = Record<string, Given | null> // a platform chosen, with its files once given

type Props = { manifest: Record<string, any>; inputs: Inputs; fileMax: number; onChange: (inputs: Inputs) => void }

export const NewAppFiles: React.FC<Props> = ({ manifest, inputs, fileMax, onChange }) => {
  const { t } = useTranslation()
  const offered = offeredPlatforms(manifest)
  return (
    <Box data-new-app-files>
      <Gutters>
        <Typography variant="body2" color="textSecondary">
          {t(
            'newApp.filesIntro',
            'Choose the platforms your app runs on, and give each its files: the program alone, a folder, or a .tar.gz. They are packed here, in your browser, as the publishing tool packs them; at most {{mb}} MB an archive.',
            { mb: Math.floor(fileMax / 2 ** 20) }
          )}
        </Typography>
      </Gutters>
      {offered.map(key => (
        <PlatformRow
          key={key}
          platform={key}
          given={inputs[key]}
          chosen={key in inputs}
          onChange={given => {
            const next = { ...inputs }
            if (given === undefined) delete next[key]
            else next[key] = given
            onChange(next)
          }}
        />
      ))}
    </Box>
  )
}

const PlatformRow: React.FC<{
  platform: string
  chosen: boolean
  given: Given | null | undefined
  onChange: (given: Given | null | undefined) => void
}> = ({ platform, chosen, given, onChange }) => {
  const { t } = useTranslation()
  const [kind, setKind] = React.useState<Given['kind']>(given?.kind ?? 'program')
  const input = useRef<HTMLInputElement>(null)
  const picked = (files: FileList | null) => {
    if (!files?.length) return
    if (kind === 'folder') onChange({ kind, files: Array.from(files) })
    else onChange({ kind, file: files[0] })
  }
  const what = !given
    ? t('newApp.noFiles', 'No files yet')
    : given.kind === 'folder'
    ? t('newApp.folderFiles', '{{count}} files', { count: given.files.length })
    : given.file.name
  return (
    <Gutters top="xs" bottom="xs" data-platform={platform}>
      <FormControlLabel
        control={
          <Checkbox
            checked={chosen}
            onChange={e => onChange(e.target.checked ? null : undefined)}
            data-platform-chosen={platform}
          />
        }
        label={
          platform === 'any'
            ? t('newApp.anyPlatform', 'any: one archive for every platform (a script, a bundle)')
            : platform
        }
      />
      {chosen && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', paddingLeft: 4 }}>
          <TextField
            select
            size="small"
            variant="filled"
            value={kind}
            onChange={e => {
              setKind(e.target.value as Given['kind'])
              onChange(null)
            }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="program">{t('newApp.kindProgram', 'The program')}</MenuItem>
            <MenuItem value="folder">{t('newApp.kindFolder', 'A folder')}</MenuItem>
            <MenuItem value="archive">{t('newApp.kindArchive', 'A .tar.gz')}</MenuItem>
          </TextField>
          <input
            ref={input}
            type="file"
            hidden
            accept={kind === 'archive' ? '.tar.gz,.tgz,application/gzip' : undefined}
            {...(kind === 'folder' ? ({ webkitdirectory: '', directory: '' } as any) : {})}
            multiple={kind === 'folder'}
            onChange={e => {
              picked(e.target.files)
              e.target.value = ''
            }}
            data-platform-input={platform}
          />
          <Button size="small" variant="outlined" onClick={() => input.current?.click()}>
            {t('newApp.chooseFiles', 'Choose…')}
          </Button>
          <Typography variant="caption" color={given ? 'textPrimary' : 'textSecondary'} data-platform-given={platform}>
            {what}
          </Typography>
        </Box>
      )}
    </Gutters>
  )
}
