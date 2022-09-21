import React from 'react'
import { makeStyles } from '@mui/styles'
import { Box, Tooltip, Typography, TooltipProps, BoxProps, Button, alpha } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { selectPriorityGuide } from '../models/ui'
import { IconButton } from '../buttons/IconButton'
import { spacing, radius, fontSizes } from '../styling'

type Props = {
  guide: string
  step: number
  placement?: TooltipProps['placement']
  instructions: React.ReactNode
  component?: BoxProps['component']
  startDate?: Date
  acknowledge?: boolean
  autoNext?: boolean
  autoStart?: boolean
  highlight?: boolean
  hideArrow?: boolean
  showNavigation?: boolean
  showStart?: boolean
  show?: boolean
  hide?: boolean
  children?: React.ReactNode
}

export const GuideStep: React.FC<Props> = ({
  guide,
  step,
  placement,
  instructions,
  acknowledge,
  startDate = new Date(0),
  component = 'div',
  autoNext,
  autoStart,
  highlight,
  hideArrow,
  showNavigation,
  showStart,
  show,
  hide,
  children,
}) => {
  const { ui } = useDispatch<Dispatch>()
  const state = useSelector((state: ApplicationState) => selectPriorityGuide(state, guide, startDate))
  const open: boolean = !!(!hide && (state.step === step || !!show) && state.active)
  const css = useStyles({ highlight: highlight && open })
  const start = () => ui.guide({ guide, step, active: true, done: false })
  const last = step === state.total

  React.useEffect(() => {
    if (!state.done && state.step === 1 && autoStart) start()
  }, [])

  if (step !== 1 && !open) return <>{children}</>

  return (
    <Tooltip
      classes={{ tooltip: css.tip, arrow: css.arrow }}
      open={open}
      arrow={!hideArrow}
      placement={placement || 'top'}
      title={
        <>
          {acknowledge || (
            <IconButton
              icon="times"
              title="Exit guide"
              color="white"
              onClick={() => ui.guide({ guide, step: 0, done: true })}
            />
          )}
          <Typography variant="body1" gutterBottom>
            {instructions}
          </Typography>
          {acknowledge && (
            <Button size="small" variant="text" onClick={() => ui.guide({ guide, step: 0, done: true })}>
              Ok
            </Button>
          )}
          {showNavigation && (
            <Box className={css.nav}>
              <IconButton
                icon="angle-left"
                title="previous"
                color="white"
                type="light"
                disabled={step <= 1}
                onClick={() => ui.guide({ guide, step: step - 1, back: true })}
              />
              <IconButton
                icon="angle-right"
                title="next"
                color="white"
                type="light"
                disabled={step >= state.total}
                onClick={() => ui.guide({ guide, step: step + 1 })}
              />
            </Box>
          )}
          {state.total > 1 && (
            <Typography variant="caption">
              {step} of {state.total}
            </Typography>
          )}
        </>
      }
    >
      <Box
        className={css.box}
        onClick={() => autoNext && ui.guide({ guide, step: last ? 0 : step + 1, done: last })}
        component={component}
      >
        {showStart && (
          <IconButton
            icon="sparkles"
            onClick={start}
            color={state.done || step === 1 ? 'grayLight' : 'guide'}
            className={css.icon}
          />
        )}
        {children}
      </Box>
    </Tooltip>
  )
}

export const useStyles = makeStyles(({ palette }) => ({
  icon: { position: 'absolute', zIndex: 1, top: -spacing.lg, right: -spacing.xl },
  box: ({ highlight }: any) => ({
    border: highlight ? `1px dotted ${palette.guide.main}` : undefined,
    // boxShadow: highlight ? `0 0 2px 0px ${palette.guide.main} inset` : undefined,
    // background: highlight ? alpha(palette.guide.main, 0.05) : undefined,
    borderRadius: radius,
    position: 'relative',
  }),
  nav: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
  },
  tip: {
    backgroundColor: palette.guide.main,
    color: palette.white.main,
    fontSize: fontSizes.lg,
    padding: spacing.lg,
    paddingRight: spacing.xl,
    margin: spacing.lg,
    position: 'relative',
    borderRadius: radius,
    '& .MuiTypography-caption': { color: palette.white.main, marginTop: spacing.md, display: 'block' },
    '& .IconButtonTooltip': {
      position: 'absolute',
      right: spacing.xs,
      top: spacing.xs,
    },
    '& .MuiButton-root': { background: alpha(palette.white.main, 0.15), color: palette.white.main },
    '& .MuiButton-root:hover': { background: alpha(palette.white.main, 0.3) },
    '& cite': {
      fontStyle: 'normal',
      textTransform: 'uppercase',
      fontWeight: 600,
      fontSize: '0.8em',
      letterSpacing: 1,
      paddingLeft: spacing.xs,
      paddingRight: spacing.xs,
    },
  },
  arrow: {
    color: palette.guide.main,
  },
}))
