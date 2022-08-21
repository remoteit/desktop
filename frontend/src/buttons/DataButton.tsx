import React from 'react'
import { makeStyles } from '@mui/styles'
import { ListItemText, IconButton, InputLabel, Tooltip } from '@mui/material'
import { spacing, fontSizes, Color } from '../styling'
import { Icon } from '../components/Icon'

export type DataButtonProps = {
  title: string
  value?: string
  label?: string
  icon: React.ReactNode
  iconColor?: Color
  gutterBottom?: boolean
  fullWidth?: boolean
  showBackground?: boolean
  onClick: (event?: any) => void
}

export const DataButton: React.FC<DataButtonProps> = ({
  title,
  value,
  label,
  icon,
  iconColor,
  gutterBottom,
  fullWidth,
  showBackground,
  onClick,
}) => {
  const css = useStyles({ showBackground, fullWidth, gutterBottom })

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
    showBackground,
    fullWidth,
    gutterBottom,
  }: {
    showBackground?: boolean
    fullWidth?: boolean
    gutterBottom?: boolean
  }) => ({
    display: 'flex',
    alignItems: 'center',
    textAlign: 'left',
    padding: spacing.sm,
    paddingLeft: spacing.xxs,
    paddingRight: spacing.lg,
    width: fullWidth ? '100%' : undefined,
    marginBottom: gutterBottom ? spacing.xs : undefined,
    backgroundColor: showBackground ? palette.grayLightest.main : undefined,
    '&:hover': { backgroundColor: showBackground ? palette.primaryHighlight.main : undefined },
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
