import React from 'react'
import { makeStyles, Box, Collapse, Button, Typography } from '@material-ui/core'
import { Icon } from './Icon'
import { Gutters } from './Gutters'
import { spacing } from '../styling'

export const Collapsible: React.FC<{ title: string; open?: boolean }> = ({ title, open, children, ...props }) => {
  const [openState, setOpenState] = React.useState<boolean>(!!open)
  const css = useStyles(openState)()

  return (
    <>
      <Gutters {...props} className={css.container} noBottom>
        <Button onClick={() => setOpenState(!openState)} fullWidth>
          <Typography variant="subtitle1">{title}</Typography>
          <Icon className={css.rotate} color="grayDarker" name="caret-down" type="solid" size="base" fixedWidth />
        </Button>
      </Gutters>
      <Collapse in={openState} timeout={400}>
        {children}
      </Collapse>
    </>
  )
}

const useStyles = open =>
  makeStyles({
    container: {
      '& button': {
        justifyContent: 'left',
        padding: 0,
      },
      '& svg': {
        marginTop: -spacing.xxs,
        marginLeft: spacing.xs,
      },
      '& .MuiTypography-subtitle1': {
        minHeight: spacing.lg,
        padding: spacing.xxs, //`${spacing.xs}px 0 ${spacing.md}px 0 `,
      },
    },
    rotate: {
      transform: `rotate(${open ? 0 : 180}deg)`,
      transformOrigin: 'center',
      transition: 'transform 400ms',
    },
  })
