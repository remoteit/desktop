import React from 'react'
import { makeStyles, Box, Tooltip, Typography, TooltipProps } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { IconButton } from '../buttons/IconButton'
import { spacing, colors, radius, fontSizes } from '../styling'

type Props = {
  guide: string
  step: number
  placement?: TooltipProps['placement']
  instructions: React.ReactElement | string
  autoNext?: boolean
  autoStart?: boolean
  last?: boolean
  highlight?: boolean
  hideArrow?: boolean
  show?: boolean
  hide?: boolean
}

export const GuideStep: React.FC<Props> = ({
  guide,
  step,
  placement,
  instructions,
  autoNext,
  autoStart,
  last,
  highlight,
  hideArrow,
  show,
  hide,
  children,
}) => {
  const { ui } = useDispatch<Dispatch>()
  const state: IGuide = useSelector((state: ApplicationState) => state.ui[guide])
  const css = useStyles({ highlight })
  const open = !hide && (state.step === step || !!show)
  const start = () => ui.guide({ guide, step, done: false })

  React.useEffect(() => {
    if (!state.done && autoStart) start()
  }, [])

  if (step !== 1 && (!open || state.done)) return <>{children}</>

  return (
    <Tooltip
      classes={{ tooltip: css.tip, arrow: css.arrow }}
      open={open}
      arrow={!hideArrow}
      interactive
      placement={placement || 'top'}
      title={
        <>
          <IconButton
            icon="times"
            title="Exit guide"
            color="white"
            onClick={() => ui.guide({ guide, step: 0, done: true })}
            className={css.close}
          />
          <Typography variant="body1">{instructions}</Typography>
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
          <Typography variant="caption">
            {step} of {state.total}
          </Typography>
        </>
      }
    >
      <Box className={css.box} onClick={() => autoNext && ui.guide({ guide, step: last ? 0 : step + 1, done: last })}>
        {step === 1 && (
          <IconButton
            icon="sparkles"
            title={state.title || 'Start guide'}
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

const useStyles = makeStyles({
  icon: { position: 'absolute', zIndex: 1, top: -spacing.lg, right: -spacing.xl },
  box: ({ highlight }: any) => ({
    border: highlight ? `1px dotted ${colors.guide}` : undefined,
    borderRadius: radius,
    position: 'relative',
  }),
  nav: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
  },
  tip: {
    backgroundColor: colors.guide,
    color: colors.white,
    fontSize: fontSizes.lg,
    padding: spacing.lg,
    paddingRight: spacing.xxl,
    position: 'relative',
    borderRadius: radius,
    '& .MuiTypography-caption': { color: colors.white, marginTop: spacing.md, display: 'block' },
  },
  arrow: {
    color: colors.guide,
  },
  close: {
    position: 'absolute',
    right: spacing.xs,
    top: spacing.xs,
  },
})
