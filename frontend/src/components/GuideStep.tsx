import React from 'react'
import { makeStyles } from '@mui/styles'
import { Box, Tooltip, Typography, TooltipProps, BoxProps } from '@mui/material'
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
  const state = useSelector((state: ApplicationState) => selectPriorityGuide(state, guide))
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
          <IconButton
            icon="times"
            title="Exit guide"
            color="white"
            onClick={() => ui.guide({ guide, step: 0, done: true })}
          />
          <Typography variant="body1">{instructions}</Typography>
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

const useStyles = makeStyles(({ palette }) => ({
  icon: { position: 'absolute', zIndex: 1, top: -spacing.lg, right: -spacing.xl },
  box: ({ highlight }: any) => ({
    border: highlight ? `1px dotted ${palette.guide.main}` : undefined,
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
    paddingRight: spacing.xxl,
    position: 'relative',
    borderRadius: radius,
    '& .MuiTypography-caption': { color: palette.white.main, marginTop: spacing.md, display: 'block' },
    '& .IconButtonTooltip': {
      position: 'absolute',
      right: spacing.xs,
      top: spacing.xs,
    },
  },
  arrow: {
    color: palette.guide.main,
  },
}))
