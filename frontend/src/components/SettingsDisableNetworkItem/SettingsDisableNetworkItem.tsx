import React from 'react'
import { useSelector } from 'react-redux'
import { makeStyles } from '@mui/styles'
import { ApplicationState } from '../../store'
import { ListItemSetting } from '../ListItemSetting'
import { emit } from '../../services/Controller'

export const SettingsDisableNetworkItem: React.FC = () => {
  const css = useStyles()
  const { preferences } = useSelector((state: ApplicationState) => state.backend)
  const [toggleChange, setToggleChange] = React.useState(false)
  const subLevelTextValue = toggleChange ? (
    <span className={css.span}>Please restart for changes to take effect.</span>
  ) : (
    'This will bind the desktop UI to localhost so that it will only be available through sharing with remote.it'
  )

  if (!preferences) return null

  const handleClick = () => {
    setToggleChange(!toggleChange)
    emit('preferences', { ...preferences, disableLocalNetwork: !preferences.disableLocalNetwork })
  }

  return (
    <ListItemSetting
      label="Disable local network discovery"
      subLabel={subLevelTextValue}
      icon={preferences.disableLocalNetwork ? 'wifi-slash' : 'wifi'}
      toggle={!!preferences.disableLocalNetwork}
      onClick={handleClick}
    />
  )
}

const useStyles = makeStyles(({ palette }) => ({
  span: { color: palette.warning.main },
}))
