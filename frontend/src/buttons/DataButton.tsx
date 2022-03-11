import React from 'react'
import { makeStyles, ListItemText, IconButton, InputLabel, Tooltip } from '@material-ui/core'
import { spacing, fontSizes, Color } from '../styling'
import { Icon } from '../components/Icon'

type Props = {
  title: string
  value?: string
  label?: string
  icon: string | React.ReactElement
  iconColor?: Color
  fullWidth?: boolean
  showBackground?: boolean
  onClick: (event?: any) => void
}

export const DataButton: React.FC<Props> = ({
  title,
  value,
  label,
  icon,
  iconColor,
  fullWidth,
  showBackground,
  onClick,
}) => {
  const css = useStyles({ showBackground, fullWidth })

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

const useStyles = makeStyles(({ palette }) => ({
  box: ({ showBackground, fullWidth }: { showBackground?: boolean; fullWidth?: boolean }) => ({
    display: 'flex',
    alignItems: 'center',
    textAlign: 'left',
    padding: spacing.sm,
    paddingLeft: spacing.xxs,
    paddingRight: spacing.lg,
    width: fullWidth ? '100%' : undefined,
    backgroundColor: showBackground ? palette.grayLightest.main : undefined,
    '&:hover': { backgroundColor: showBackground ? palette.primaryHighlight.main : undefined },
    '& svg': { minWidth: 60 },
  }),
  key: {
    fontSize: fontSizes.sm,
    color: palette.grayDarker.main,
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
}))
