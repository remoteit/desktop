import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Button, Checkbox, FormControlLabel, IconButton, MenuItem, TextField, Typography } from '@mui/material'
import { Gutters } from './Gutters'
import { Icon } from './Icon'
import { AppForm, newSetting, OSES, protocolsFor, SettingRow, SettingType } from '../helpers/appManifest'

/* New app's guided form (presence-server docs/device-apps-new-app.md, "New app"): one section a question, each the
   contract-1 member of the same name (remoteit/apps docs/contract.md) — the app, how it runs (restricted or root),
   where it listens, its service and health, its settings and its capabilities. What it says is the manifest
   (helpers/appManifest manifestOf); whether that is one remote.it takes is the page's to say. */

type Props = { form: AppForm; publisher: string; onChange: (form: AppForm) => void }

const field = { fullWidth: true, size: 'small' as const, variant: 'filled' as const, sx: { marginBottom: 1 } }

export const NewAppForm: React.FC<Props> = ({ form, publisher, onChange }) => {
  const { t } = useTranslation()
  const set = (change: Partial<AppForm>) => onChange({ ...form, ...change })
  const text = (key: keyof AppForm) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set({ [key]: e.target.value } as Partial<AppForm>),
    inputProps: { [`data-field-${key}`]: true },
  })
  const ported = form.listen === 'tcp' || form.listen === 'udp'
  const probed = form.listen === 'tcp' || form.listen === 'unix'

  return (
    <Box data-new-app-form>
      <Section title={t('newApp.appTitle', 'The app')}>
        <TextField
          {...field}
          {...text('id')}
          label={t('newApp.id', 'App id')}
          helperText={t('newApp.idHelp', '1 to 32 of a–z, 0–9 and -: the app is {{publisher}}.<id>, for good', {
            publisher,
          })}
          onChange={e => set({ id: e.target.value.toLowerCase() })}
          InputProps={{ startAdornment: <Typography color="textSecondary">{publisher}.</Typography> }}
        />
        <TextField
          {...field}
          {...text('name')}
          label={t('newApp.name', 'Name')}
          inputProps={{ maxLength: 64, 'data-field-name': true }}
        />
        <TextField
          {...field}
          {...text('description')}
          multiline
          label={t('newApp.description', 'Description')}
          inputProps={{ maxLength: 512, 'data-field-description': true }}
        />
        <TextField
          {...field}
          {...text('version')}
          label={t('newApp.version', 'Version')}
          helperText={t('newApp.versionHelp', 'Semantic versioning: 1.0.0')}
        />
        <TextField
          {...field}
          {...text('notes')}
          multiline
          minRows={2}
          label={t('newApp.notes', 'Release notes (optional)')}
        />
      </Section>

      <Section title={t('newApp.runsTitle', 'How it runs')}>
        <FormControlLabel
          control={<Checkbox checked={form.perOs} onChange={e => set({ perOs: e.target.checked })} data-field-per-os />}
          label={t('newApp.perOs', 'A different program on each operating system')}
        />
        {form.perOs ? (
          OSES.map(os => (
            <TextField
              {...field}
              key={os}
              label={t('newApp.commandFor', 'Program on {{os}} (empty: not offered there)', { os })}
              value={form.commands[os]}
              onChange={e => set({ commands: { ...form.commands, [os]: e.target.value } })}
              inputProps={{ [`data-field-command-${os}`]: true }}
            />
          ))
        ) : (
          <TextField
            {...field}
            {...text('command')}
            label={t('newApp.command', 'Program')}
            helperText={t(
              'newApp.commandHelp',
              'A path in the app’s files (bin/panel), or an absolute path to a program the device has (/usr/sbin/sshd)'
            )}
          />
        )}
        <TextField
          {...field}
          {...text('args')}
          multiline
          label={t('newApp.args', 'Arguments, one a line')}
          helperText={t(
            'newApp.argsHelp',
            'Values: ${setting.NAME} for a setting, ${remoteit.port} for the port Remote.It picks, and the others the contract lists'
          )}
        />
        <TextField
          {...field}
          {...text('env')}
          multiline
          label={t('newApp.env', 'Environment, NAME=value one a line')}
        />
        <TextField
          {...field}
          select
          label={t('newApp.as', 'Runs as')}
          value={form.as}
          onChange={e => set({ as: e.target.value as AppForm['as'] })}
          inputProps={{ 'data-field-as': true }}
        >
          <MenuItem value="restricted">
            {t('newApp.restricted', 'Restricted: an account of its own (recommended)')}
          </MenuItem>
          <MenuItem value="root">{t('newApp.root', 'Root: full control of the device')}</MenuItem>
        </TextField>
        <TextField
          {...field}
          select
          label={t('newApp.onChange', 'When a setting changes')}
          value={form.onChange}
          onChange={e => set({ onChange: e.target.value as AppForm['onChange'] })}
        >
          <MenuItem value="restart">{t('newApp.onChangeRestart', 'Restart the app')}</MenuItem>
          <MenuItem value="signal:SIGHUP">{t('newApp.onChangeHup', 'Send it SIGHUP (Linux and macOS)')}</MenuItem>
          <MenuItem value="nothing">{t('newApp.onChangeNothing', 'Nothing: it watches its app.json')}</MenuItem>
        </TextField>
      </Section>

      <Section title={t('newApp.listenTitle', 'Where it listens, and its service')}>
        <TextField
          {...field}
          select
          label={t('newApp.listen', 'Listens on')}
          value={form.listen}
          onChange={e => {
            const listen = e.target.value as AppForm['listen']
            set({
              listen,
              protocol: protocolsFor(listen).includes(form.protocol) ? form.protocol : protocolsFor(listen)[0],
            })
          }}
          inputProps={{ 'data-field-listen': true }}
        >
          <MenuItem value="none">{t('newApp.listenNone', 'Nothing: it serves no one (an agent)')}</MenuItem>
          <MenuItem value="tcp">{t('newApp.listenTcp', 'A TCP port on 127.0.0.1')}</MenuItem>
          <MenuItem value="udp">{t('newApp.listenUdp', 'A UDP port on 127.0.0.1')}</MenuItem>
          <MenuItem value="unix">{t('newApp.listenUnix', 'A Unix socket Remote.It gives it')}</MenuItem>
          <MenuItem value="stdio">
            {t('newApp.listenStdio', 'Standard input and output, run once a connection')}
          </MenuItem>
        </TextField>
        {ported && (
          <>
            <TextField
              {...field}
              select
              label={t('newApp.portMode', 'Its port')}
              value={form.portMode}
              onChange={e => set({ portMode: e.target.value as AppForm['portMode'] })}
            >
              <MenuItem value="auto">{t('newApp.portAuto', 'A free one Remote.It picks: ${remoteit.port}')}</MenuItem>
              <MenuItem value="fixed">{t('newApp.portFixed', 'A fixed port the program always binds')}</MenuItem>
              <MenuItem value="setting">
                {t('newApp.portSetting', 'A port the owner sets (an int setting with min and max)')}
              </MenuItem>
            </TextField>
            {form.portMode === 'fixed' && <TextField {...field} {...text('port')} label={t('newApp.port', 'Port')} />}
            {form.portMode === 'setting' && (
              <TextField {...field} {...text('portSetting')} label={t('newApp.portSettingName', 'Setting')} />
            )}
          </>
        )}
        {probed && (
          <FormControlLabel
            control={<Checkbox checked={form.identity} onChange={e => set({ identity: e.target.checked })} />}
            label={t('newApp.identity', 'Start each connection with a line naming its session')}
          />
        )}
        {form.listen !== 'none' && (
          <>
            <TextField
              {...field}
              {...text('serviceName')}
              label={t('newApp.serviceName', 'Service name (empty: the app’s name)')}
            />
            <TextField
              {...field}
              select
              label={t('newApp.protocol', 'Opened as')}
              value={form.protocol}
              onChange={e => set({ protocol: e.target.value })}
              inputProps={{ 'data-field-protocol': true }}
            >
              {protocolsFor(form.listen).map(protocol => (
                <MenuItem key={protocol} value={protocol}>
                  {protocol}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              {...field}
              {...text('servicePort')}
              label={t('newApp.servicePort', 'Port people use')}
              helperText={t(
                'newApp.servicePortHelp',
                'Empty: the protocol’s own (ssh 22, http 80…). A number, or ${setting.NAME}'
              )}
            />
          </>
        )}
        {probed && (
          <>
            <TextField
              {...field}
              select
              label={t('newApp.health', 'Health check')}
              value={form.health}
              onChange={e => set({ health: e.target.value as AppForm['health'] })}
            >
              <MenuItem value="none">{t('newApp.healthNone', 'None: running is healthy')}</MenuItem>
              <MenuItem value="tcp">{t('newApp.healthTcp', 'It accepts a connection')}</MenuItem>
              <MenuItem value="http">{t('newApp.healthHttp', 'An HTTP GET answers below 500')}</MenuItem>
            </TextField>
            {form.health === 'http' && (
              <TextField {...field} {...text('healthPath')} label={t('newApp.healthPath', 'Path')} />
            )}
            {form.health !== 'none' && (
              <TextField
                {...field}
                {...text('healthInterval')}
                label={t('newApp.healthInterval', 'Every (seconds; empty: 30)')}
              />
            )}
          </>
        )}
      </Section>

      <Section title={t('newApp.settingsTitle', 'Settings its owner may change')}>
        {form.settings.map((row, index) => (
          <SettingEditor
            key={index}
            row={row}
            onChange={changed => set({ settings: form.settings.map((r, i) => (i === index ? changed : r)) })}
            onRemove={() => set({ settings: form.settings.filter((_, i) => i !== index) })}
          />
        ))}
        <Button size="small" onClick={() => set({ settings: [...form.settings, newSetting()] })} data-add-setting>
          {t('newApp.addSetting', 'Add a setting')}
        </Button>
      </Section>

      <Section title={t('newApp.capabilitiesTitle', 'Capabilities (optional)')}>
        <Typography variant="caption" color="textSecondary" component="p" gutterBottom>
          {t(
            'newApp.capabilitiesIntro',
            'What the app asks of Remote.It beyond an ordinary app. Shown where it is offered, and part of the owner’s consent.'
          )}
        </Typography>
        <FormControlLabel
          control={<Checkbox checked={form.personAccounts} onChange={e => set({ personAccounts: e.target.checked })} />}
          label={t('newApp.personAccounts', 'People’s own accounts on the device (root apps only)')}
        />
        <FormControlLabel
          control={
            <Checkbox checked={form.personCertificates} onChange={e => set({ personCertificates: e.target.checked })} />
          }
          label={t('newApp.personCertificates', 'Certificates Remote.It signs for people, for its ssh service')}
        />
        <FormControlLabel
          control={<Checkbox checked={form.sshExec} onChange={e => set({ sshExec: e.target.checked })} />}
          label={t('newApp.sshExec', 'AI commands through its ssh service, while a bool setting allows them')}
        />
        {form.sshExec && (
          <TextField {...field} {...text('sshExecGate')} label={t('newApp.sshExecGate', 'The bool setting')} />
        )}
      </Section>
    </Box>
  )
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <>
    <Typography variant="subtitle1">{title}</Typography>
    <Gutters>{children}</Gutters>
  </>
)

const TYPES: SettingType[] = ['bool', 'int', 'string', 'choice', 'list']

const SettingEditor: React.FC<{ row: SettingRow; onChange: (row: SettingRow) => void; onRemove: () => void }> = ({
  row,
  onChange,
  onRemove,
}) => {
  const { t } = useTranslation()
  const set = (change: Partial<SettingRow>) => onChange({ ...row, ...change })
  const text = (key: keyof SettingRow, label: string) => (
    <TextField
      {...field}
      label={label}
      value={row[key] as string}
      onChange={e => set({ [key]: e.target.value } as Partial<SettingRow>)}
    />
  )
  return (
    <Box sx={{ borderLeft: 2, borderColor: 'grayLighter.main', paddingLeft: 2, marginBottom: 2 }} data-setting-row>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          {...field}
          label={t('newApp.settingName', 'Name: a–z, 0–9, _')}
          value={row.name}
          onChange={e => set({ name: e.target.value })}
          inputProps={{ 'data-setting-name': true }}
        />
        <TextField
          {...field}
          select
          label={t('newApp.settingType', 'Type')}
          value={row.type}
          onChange={e => set({ type: e.target.value as SettingType })}
        >
          {TYPES.map(type => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </TextField>
        <IconButton onClick={onRemove} title={t('newApp.removeSetting', 'Remove this setting')} data-remove-setting>
          <Icon name="times" size="md" />
        </IconButton>
      </Box>
      {text('label', t('newApp.settingLabel', 'Label'))}
      {text('help', t('newApp.settingHelp', 'Help'))}
      {row.type === 'choice' && (
        <TextField
          {...field}
          multiline
          label={t('newApp.settingChoices', 'Choices, one a line: value or value=Label')}
          value={row.choices}
          onChange={e => set({ choices: e.target.value })}
        />
      )}
      {text(
        'default',
        row.type === 'list'
          ? t('newApp.settingDefaultList', 'Default, comma separated')
          : t('newApp.settingDefault', 'Default')
      )}
      {row.type === 'int' && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {text('min', t('newApp.settingMin', 'Min'))}
          {text('max', t('newApp.settingMax', 'Max'))}
        </Box>
      )}
      {(row.type === 'string' || row.type === 'list') && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {text(
            'maxLength',
            row.type === 'list'
              ? t('newApp.settingItemLength', 'Item max length')
              : t('newApp.settingMaxLength', 'Max length (≤ 256)')
          )}
          {text('pattern', t('newApp.settingPattern', 'Pattern (a regular expression the whole value matches)'))}
        </Box>
      )}
      {row.type === 'list' && text('maxItems', t('newApp.settingMaxItems', 'Max items (≤ 32)'))}
      {(row.type === 'bool' || row.type === 'choice') && (
        <FormControlLabel
          control={<Checkbox checked={row.forcible} onChange={e => set({ forcible: e.target.checked })} />}
          label={t('newApp.settingForcible', 'The device’s administrator or a product may fix it')}
        />
      )}
    </Box>
  )
}
