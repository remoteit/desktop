import React from 'react'
import { makeStyles } from '@mui/styles'
import { ListItemText, IconButton, InputLabel, Tooltip, darken } from '@mui/material'
import { spacing, fontSizes, Color } from '../styling'
import { Icon } from '../components/Icon'

export type DataButtonProps = {
  title: string
  value?: string
  label?: string
  dense?: boolean
  icon: React.ReactNode | null
  iconColor?: Color
  gutterBottom?: boolean
  fullWidth?: boolean
  showBackground?: boolean
  alwaysWhite?: boolean
  onClick: (event?: any) => void
}

export const DataButton: React.FC<DataButtonProps> = ({
  title,
  value,
  label,
  dense,
  icon,
  iconColor,
  gutterBottom,
  fullWidth,
  showBackground,
  alwaysWhite,
  onClick,
}) => {
  const css = useStyles({ icon: !!icon, showBackground, fullWidth, gutterBottom, alwaysWhite, dense })

  return (
    <Tooltip title={title} enterDelay={500} placement="top" arrow>
      <IconButton className={css.box} onClick={onClick} size="large">
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
  box: ({
    icon,
    showBackground,
    fullWidth,
    gutterBottom,
    alwaysWhite,
    dense,
  }: {
    icon?: boolean
    showBackground?: boolean
    fullWidth?: boolean
    gutterBottom?: boolean
    alwaysWhite?: boolean
    dense?: boolean
  }) => ({
    display: 'flex',
    alignItems: 'center',
    textAlign: 'left',
    color: alwaysWhite ? palette.alwaysWhite.main : palette.grayDarkest.main,
    padding: dense ? spacing.xxs : spacing.sm,
    paddingLeft: icon ? spacing.xxs : dense ? spacing.md : undefined,
    paddingRight: dense ? spacing.md : spacing.lg,
    width: fullWidth ? '100%' : undefined,
    marginBottom: gutterBottom ? spacing.sm : undefined,
    backgroundColor: showBackground ? (alwaysWhite ? palette.screen.main : palette.grayLightest.main) : undefined,
    '& .MuiTypography-root > *': { color: alwaysWhite ? palette.alwaysWhite.main : palette.grayDarkest.main },
    '&:hover': {
      backgroundColor: showBackground
        ? alwaysWhite
          ? darken(palette.primary.main, 0.15)
          : palette.primaryHighlight.main
        : undefined,
    },
    '& svg': { minWidth: 60 },
  }),
  key: {
    fontSize: fontSizes.sm,
    color: palette.grayDarker.main,
    margin: 0,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
  },
}))
