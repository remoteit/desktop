import React from 'react'
import { makeStyles, Box, Collapse, Button, Typography } from '@material-ui/core'
import { ExpandIcon } from './ExpandIcon'
import { Gutters } from './Gutters'
import { spacing } from '../styling'

export const Collapsible: React.FC<{ title: string; open?: boolean }> = ({ title, open, children, ...props }) => {
  const [openState, setOpenState] = React.useState<boolean>(!!open)
  const css = useStyles()

  return (
    <>
      <Gutters {...props} className={css.container} noBottom>
        <Button onClick={() => setOpenState(!openState)} fullWidth>
          <Typography variant="subtitle1">{title}</Typography>
          <ExpandIcon open={openState} />
        </Button>
      </Gutters>
      <Collapse in={openState} timeout={400}>
        {children}
      </Collapse>
    </>
  )
}

const useStyles = makeStyles({
  container: {
    '& button': {
      justifyContent: 'left',
      padding: 0,
    },
    '& .MuiTypography-subtitle1': {
      minHeight: spacing.lg,
      padding: spacing.xxs, //`${spacing.xs}px 0 ${spacing.md}px 0 `,
    },
  },
})
