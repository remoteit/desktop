import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { makeStyles } from '@material-ui/core/styles'
import { ApplicationState, Dispatch } from '../../store'
import { SettingsListItem } from '../ListItemSetting'
import { colors } from '../../styling'
import { emit } from '../../services/Controller'

export const SettingsDisableNetworkItem: React.FC = () => {
  const css = useStyles()
  const { preferences } = useSelector((state: ApplicationState) => ({
    preferences: state.backend.preferences,
  }))
  const [toggleChange, setToggleChange] = React.useState(false)
  const subLevelTextValue = toggleChange ? (
    <span className={css.span}>Please restart for changes to take effect.</span>
  ) : (
    'This will bind the desktop UI to localhost so that it will only be available through sharing with remote.it'
  )

  const handleClick = () => {
    setToggleChange(!toggleChange)
    emit('preferences', { ...preferences, disabledLocalNetwork: !preferences.disabledLocalNetwork })
  }

  return (
    <SettingsListItem
      label="Disable local network discovery"
      subLabel={subLevelTextValue}
      icon={preferences.disabledLocalNetwork ? 'wifi-slash' : 'wifi'}
      toggle={!!preferences.disabledLocalNetwork}
      onClick={handleClick}
    />
  )
}

const useStyles = makeStyles({
  span: { color: colors.warning },
})
