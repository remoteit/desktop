import React from 'react'
import { useHistory } from 'react-router-dom'
import { useNavigation } from '../hooks/useNavigation'
import { BottomNavigation, BottomNavigationAction, Badge } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Icon } from './Icon'
import { colors } from '../styling'

export const FooterNav: React.FC = () => {
  const [menu, menuItems] = useNavigation()
  const history = useHistory()
  const css = useStyles()

  return (
    <BottomNavigation className={css.footer} value={menu} onChange={(_, location) => history.push(location)} showLabels>
      {menuItems.reduce((items: JSX.Element[], m) => {
        if (m.show)
          items.push(
            <BottomNavigationAction
              key={m.path}
              label={m.label}
              value={m.path}
              icon={
                m.badge ? (
                  <Badge variant={m.badge > 1 ? undefined : 'dot'} badgeContent={m.badge} color="error">
                    <Icon name={m.icon} size="lg" />
                  </Badge>
                ) : (
                  <Icon name={m.icon} size="lg" />
                )
              }
            />
          )
        return items
      }, [])}
    </BottomNavigation>
  )
}

const useStyles = makeStyles({
  footer: {
    borderTop: `1px solid ${colors.grayLight}`,
    minHeight: 62,
    justifyContent: 'space-evenly',
    '& .MuiButtonBase-root': { maxWidth: '18%' },
  },
})
