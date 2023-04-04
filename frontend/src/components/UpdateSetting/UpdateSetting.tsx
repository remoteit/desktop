import React from 'react'
import { emit } from '../../services/Controller'
import { Button } from '@mui/material'
import { fullVersion, version as currentVersion } from '../../helpers/versionHelper'
import { ApplicationState, Dispatch } from '../../store'
import { useSelector, useDispatch } from 'react-redux'
import { ListItemSetting } from '../ListItemSetting'
import { DesktopUI } from '../DesktopUI'
import { ColorChip } from '../ColorChip'
import { Duration } from '../Duration'
import { TestUI } from '../TestUI'

export const UpdateSetting: React.FC<{ preferences: IPreferences; os?: Ios }> = ({ preferences, os }) => {
  const { version, nextCheck, checking, downloaded, error } = useSelector(
    (state: ApplicationState) => state.backend.updateStatus
  )
  const dispatch = useDispatch<Dispatch>()
  const updateAvailable = downloaded && version !== currentVersion

  let label = 'About'
  if (updateAvailable) label = `Version ${version} available`
  if (checking) label = 'Checking for updates...'

  return (
    <>
      {(os === 'mac' || os === 'windows') && (
        <DesktopUI>
          <ListItemSetting
            label="Auto update"
            subLabel={
              nextCheck && preferences.autoUpdate ? (
                <>
                  Next check in <Duration startDate={new Date(nextCheck)} />
                </>
              ) : undefined
            }
            icon="chevron-double-up"
            button={preferences.autoUpdate ? (checking ? 'Checking...' : 'Check') : undefined}
            onButtonClick={() => !checking && emit('update/check')}
            toggle={!!preferences.autoUpdate}
            onClick={() => emit('preferences', { ...preferences, autoUpdate: !preferences.autoUpdate })}
          />
          {preferences.autoUpdate && (
            <TestUI>
              <ListItemSetting
                quote
                label="Update to pre-release builds"
                toggle={!!preferences.allowPrerelease}
                onClick={() => emit('preferences', { ...preferences, allowPrerelease: !preferences.allowPrerelease })}
              />
            </TestUI>
          )}
        </DesktopUI>
      )}
      <ListItemSetting
        label={label}
        subLabel={<>{fullVersion()} — © remot3.it inc.</>}
        icon="copyright"
        secondaryContent={
          error ? (
            <ColorChip label="Update error" typeColor="danger" size="small" />
          ) : updateAvailable ? (
            <>
              <Button
                onClick={dispatch.backend.install}
                color="primary"
                variant="contained"
                size="small"
                disabled={checking}
              >
                Install
              </Button>
            </>
          ) : undefined
        }
      />
    </>
  )
}
