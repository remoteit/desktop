import React, { useRef } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { emit } from '../../services/Controller'
import { Button } from '@mui/material'
import { fullVersion, version as currentVersion } from '../../helpers/versionHelper'
import { State, Dispatch } from '../../store'
import { useSelector, useDispatch } from 'react-redux'
import { ListItemSetting } from '../ListItemSetting'
import { DesktopUI } from '../DesktopUI'
import { ColorChip } from '../ColorChip'
import { Duration } from '../Duration'
import { TestUI } from '../TestUI'

export const UpdateSetting: React.FC<{ preferences: IPreferences; os?: Ios }> = ({ preferences, os }) => {
  const { t } = useTranslation()
  const { version, nextCheck, checking, downloaded, downloading, error } = useSelector(
    (state: State) => state.backend.updateStatus
  )
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  // Seven taps on About within a few seconds open the Test UI: the way in on a phone, which has no Alt-Shift menu.
  const taps = useRef<number[]>([])
  const tapAbout = () => {
    const now = Date.now()
    taps.current = [...taps.current.filter(at => now - at < 4000), now]
    if (taps.current.length < 7) return
    taps.current = []
    dispatch.ui.setPersistent({ testUI: 'HIGHLIGHT' })
    history.push('/settings/test')
  }
  const updateAvailable = downloaded && version !== currentVersion

  let label = t('updateSetting.about', 'About')
  if (updateAvailable)
    label = t('updateSetting.versionAvailable', { version, defaultValue: 'Version {{version}} available' })
  if (checking) label = t('updateSetting.checkingForUpdates', 'Checking for updates...')

  return (
    <>
      {(os === 'mac' || os === 'windows') && (
        <DesktopUI>
          <ListItemSetting
            label={t('updateSetting.autoUpdate', 'Auto update')}
            subLabel={
              nextCheck && preferences.autoUpdate ? (
                <>
                  {t('updateSetting.nextCheckIn', 'Next check in')} <Duration startDate={new Date(nextCheck)} />
                </>
              ) : undefined
            }
            icon="chevron-double-up"
            secondaryContent={
              preferences.autoUpdate && (
                <Button
                  onClick={event => {
                    event.stopPropagation()
                    emit('update/check')
                  }}
                  color="primary"
                  size="small"
                  disabled={downloading}
                >
                  {downloading
                    ? t('updateSetting.downloading', 'Downloading...')
                    : checking
                    ? t('updateSetting.checking', 'Checking...')
                    : t('updateSetting.check', 'Check')}
                </Button>
              )
            }
            toggle={!!preferences.autoUpdate}
            onClick={() => emit('preferences', { autoUpdate: !preferences.autoUpdate })}
          />
          {preferences.autoUpdate && (
            <TestUI>
              <ListItemSetting
                quote
                label={t('updateSetting.preReleaseBuilds', 'Update to pre-release builds')}
                toggle={!!preferences.allowPrerelease}
                onClick={() => emit('preferences', { allowPrerelease: !preferences.allowPrerelease })}
              />
            </TestUI>
          )}
        </DesktopUI>
      )}
      <ListItemSetting
        label={label}
        subLabel={
          <>
            {fullVersion()} — {t('updateSetting.copyright', '© remot3.it inc.')}
          </>
        }
        icon="copyright"
        onClick={tapAbout}
        secondaryContent={
          error ? (
            <ColorChip label={t('updateSetting.updateFailed', 'Update failed')} color="warning" size="small" />
          ) : updateAvailable && downloaded ? (
            <Button
              onClick={dispatch.backend.install}
              color="primary"
              variant="contained"
              size="small"
              disabled={checking || downloading}
            >
              {t('updateSetting.install', 'Install')}
            </Button>
          ) : undefined
        }
      />
    </>
  )
}
