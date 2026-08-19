import React from 'react'
import {
  Box,
  ListItemButton as MuiListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  InputLabel,
  Tooltip,
  alpha,
} from '@mui/material'
import { spacing, fontSizes } from '../styling'
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
  return (
    <Tooltip title={title} enterDelay={500} placement="top" arrow>
      <span>
        <MuiListItemButton
          sx={theme => ({
            display: 'flex',
            alignItems: 'center',
            textAlign: 'left',
            color: alwaysWhite ? theme.palette.alwaysWhite.main : theme.palette.grayDarkest.main,
            padding: dense ? `${spacing.xxs}px` : `${spacing.sm}px`,
            paddingLeft: icon ? `${spacing.xxs}px` : dense ? `${spacing.md}px` : undefined,
            paddingRight: dense ? `${spacing.md}px` : `${spacing.lg}px`,
            width: fullWidth ? '100%' : undefined,
            marginBottom: gutterBottom ? `${spacing.sm}px` : undefined,
            backgroundColor: showBackground
              ? invertBackground
                ? alpha(theme.palette.white.main, 0.7)
                : theme.palette.screen.main
              : undefined,
            '& .MuiTypography-root > *': {
              color: alwaysWhite ? theme.palette.alwaysWhite.main : theme.palette.grayDarkest.main,
            },
            '&:hover': {
              backgroundColor: showBackground ? (invertBackground ? theme.palette.white.main : undefined) : undefined,
            },
            '& svg': { minWidth: 60 },
          })}
          onClick={onClick}
          disableGutters
        >
          {typeof icon === 'string' ? <Icon name={icon} color={iconColor} size="md" fixedWidth /> : icon}
          <ListItemText>
            <InputLabel shrink>{label}</InputLabel>
            <Box
              component="pre"
              sx={{
                fontSize: fontSizes.sm,
                color: 'grayDarker.main',
                margin: 0,
                whiteSpace: 'pre-wrap',
                overflowWrap: 'break-word',
                userSelect: 'text',
              }}
            >
              {value}
            </Box>
          </ListItemText>
          {action && <ListItemSecondaryAction>{action}</ListItemSecondaryAction>}
        </MuiListItemButton>
      </span>
    </Tooltip>
  )
}

