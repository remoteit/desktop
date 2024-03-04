import React from 'react'
import { makeStyles } from '@mui/styles'
import {
  ListItemButton as MuiListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  InputLabel,
  Tooltip,
  alpha,
} from '@mui/material'
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
  invertBackground?: boolean
  showBackground?: boolean
  alwaysWhite?: boolean
  action?: React.ReactNode
  onClick: (event?: any) => void
}

export const ListItemButton: React.FC<DataButtonProps> = ({
  title,
  value,
  label,
  dense,
  icon,
  iconColor,
  gutterBottom,
  fullWidth,
  invertBackground,
  showBackground,
  alwaysWhite,
  onClick,
  action,
}) => {
  const css = useStyles({ icon: !!icon, showBackground, invertBackground, fullWidth, gutterBottom, alwaysWhite, dense })

  return (
    <Tooltip title={title} enterDelay={500} placement="top" arrow>
      <span>
        <MuiListItemButton className={css.box} onClick={onClick} disableGutters>
          {typeof icon === 'string' ? <Icon name={icon} color={iconColor} size="md" fixedWidth /> : icon}
          <ListItemText>
            <InputLabel shrink>{label}</InputLabel>
            <pre className={css.key}>{value}</pre>
          </ListItemText>
          {action && <ListItemSecondaryAction>{action}</ListItemSecondaryAction>}
        </MuiListItemButton>
      </span>
    </Tooltip>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  box: ({
    icon,
    showBackground,
    invertBackground,
    fullWidth,
    gutterBottom,
    alwaysWhite,
    dense,
  }: {
    icon?: boolean
    showBackground?: boolean
    invertBackground?: boolean
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
    backgroundColor: showBackground
      ? invertBackground
        ? alpha(palette.white.main, 0.7)
        : palette.screen.main
      : undefined,
    '& .MuiTypography-root > *': { color: alwaysWhite ? palette.alwaysWhite.main : palette.grayDarkest.main },
    '&:hover': {
      backgroundColor: showBackground
        ? invertBackground
          ? palette.white.main
          : alpha(palette.black.main, 0.1)
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
    userSelect: 'text',
  },
}))
