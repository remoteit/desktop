import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { makeStyles } from '@material-ui/core/styles'
import { ApplicationState, Dispatch } from '../../store'
import { SettingsListItem } from '../SettingsListItem'
import { colors } from '../../styling'
import { emit } from '../../services/Controller'

type Props = {
  icon?: string
  button?: string
  toggle?: boolean
  disabled?: boolean
  onClick?: () => void
}

export const SettingsDisableNetworkItem: React.FC<Props> = ({ icon, button, toggle, onClick, disabled }) => {
  const css = useStyles()
  const { preferences } = useSelector((state: ApplicationState) => ({
    preferences: state.backend.preferences,
  }))

  const subLevelTextValue = (
    <span>
      This will bind the desktop UI to localhost so that it will only be available through sharing with remote.it
    </span>
  )
  const [disabledLocalNetwork, setDisabledLocalNetwork] = React.useState(preferences.disabledLocalNetwork)
  const [sublevelText, setSubLevelText] = React.useState(subLevelTextValue)

  const handleClick = () => {
    emit('preferences', { ...preferences, disabledLocalNetwork: !preferences.disabledLocalNetwork })
  }

  useEffect(() => {
    const icon = preferences.disabledLocalNetwork ? 'wifi-slash' : 'wifi'

    if (disabledLocalNetwork == preferences.disabledLocalNetwork) {
      setSubLevelText(
        <span>
          This will bind the desktop UI to localhost so that it will only be available through sharing with remote.it
        </span>
      )
    } else {
      setSubLevelText(<span className={css.span}>Please restart for changes to take effect.</span>)
    }
  }, [preferences.disabledLocalNetwork])

  return (
    <SettingsListItem
      label="Disable local network discovery"
      subLabel={sublevelText}
      icon={preferences.disabledLocalNetwork ? 'wifi-slash' : 'wifi'}
      toggle={preferences.disabledLocalNetwork}
      onClick={handleClick}
    />
  )
}

const useStyles = makeStyles({
  span: { color: colors.warning },
})
