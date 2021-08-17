import React from 'react'
import { makeStyles, ListItemText, IconButton, InputLabel, Tooltip } from '@material-ui/core'
import { colors, spacing, fontSizes, Color } from '../styling'
import { Icon } from '../components/Icon'

type Props = {
  title: string
  value?: string
  label: string
  icon: string | React.ReactElement
  iconColor?: Color
  onClick: (event?: any) => void
}

export const DataButton: React.FC<Props> = ({ title, value, label, icon, iconColor, onClick }) => {
  const css = useStyles()

  return (
    <Tooltip title={title} enterDelay={500} placement="top" arrow>
      <IconButton className={css.box} onClick={onClick}>
        {typeof icon === 'string' ? <Icon name={icon} color={iconColor} size="md" fixedWidth /> : icon}
        <ListItemText>
          <InputLabel shrink>{label}</InputLabel>
          <pre className={css.key}>{value}</pre>
        </ListItemText>
      </IconButton>
    </Tooltip>
  )
}

const useStyles = makeStyles({
  box: {
    display: 'flex',
    alignItems: 'center',
    textAlign: 'left',
    padding: spacing.xs,
    paddingLeft: spacing.xxs,
    paddingRight: spacing.xxs,
    width: '100%',
    '& svg': { minWidth: 60 },
  },
  key: {
    fontSize: fontSizes.sm,
    color: colors.grayDarker,
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
})
