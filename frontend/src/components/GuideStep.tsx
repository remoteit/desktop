import React from 'react'
import { Box, Tooltip, Typography, TooltipProps, BoxProps, Button, Theme, alpha } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { selectPriorityGuide } from '../models/ui'
import { IconButton } from '../buttons/IconButton'
import { spacing, radius, fontSizes } from '../styling'

export const boxSx = (highlight?: boolean) => (theme: Theme) => ({
  border: highlight ? `1px dotted ${theme.palette.guide.main}` : undefined,
  borderRadius: `${radius.lg}px`,
  position: 'relative' as const,
})

export const arrowSx = (theme: Theme) => ({ color: theme.palette.guide.main })

export const tipSx = (theme: Theme) => ({
  backgroundColor: theme.palette.guide.main,
  color: theme.palette.white.main,
  fontSize: fontSizes.lg,
  padding: `${spacing.lg}px`,
  paddingRight: `${spacing.xl}px`,
  margin: `${spacing.lg}px`,
  position: 'relative',
  borderRadius: `${radius.lg}px`,
  '& .MuiTypography-caption': { color: theme.palette.white.main, marginTop: `${spacing.md}px`, display: 'block' },
  '& .MuiLink-root': {
    color: theme.palette.white.main,
    marginRight: `${-spacing.sm}px`,
    textDecoration: 'none',
    fontSize: fontSizes.xs,
    fontWeight: 400,
    cursor: 'pointer',
    opacity: 0.3,
  },
  '& .MuiLink-root:hover': { opacity: 1 },
  '& .IconButtonTooltip': { position: 'absolute', right: `${spacing.xs}px`, top: `${spacing.xs}px` },
  '& .MuiButton-root': { background: alpha(theme.palette.white.main, 0.15), color: theme.palette.white.main },
  '& .MuiButton-root:hover': { background: alpha(theme.palette.white.main, 0.3) },
  '& cite': {
    fontStyle: 'normal',
    textTransform: 'uppercase',
    fontWeight: 700,
    fontSize: '0.8em',
    letterSpacing: 1,
    paddingLeft: `${spacing.xs}px`,
    paddingRight: `${spacing.xs}px`,
  },
})

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
  const state = useSelector((state: State) => selectPriorityGuide(state, guide, startDate))
  const open: boolean = !!(!hide && (state.step === step || !!show) && state.active)
  const start = () => ui.guide({ guide, step, active: true, done: false })
  const last = step === state.total

  React.useEffect(() => {
    if (!state.done && state.step === 1 && autoStart) start()
  }, [])

  if (step !== 1 && !open) return <>{children}</>

  return (
    <Tooltip
      slotProps={{ tooltip: { sx: tipSx }, arrow: { sx: arrowSx } }}
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
            <Box sx={{ position: 'absolute', right: `${spacing.sm}px`, bottom: `${spacing.sm}px` }}>
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
        sx={boxSx(highlight && open)}
        onClick={() => autoNext && ui.guide({ guide, step: last ? 0 : step + 1, done: last })}
        component={component}
      >
        {showStart && (
          <IconButton
            icon="sparkles"
            onClick={start}
            color={state.done || step === 1 ? 'grayLight' : 'guide'}
            sx={{ position: 'absolute', zIndex: 1, top: `${-spacing.lg}px`, right: `${-spacing.xl}px` }}
          />
        )}
        {children}
      </Box>
    </Tooltip>
  )
}

