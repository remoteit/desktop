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
  highlight?: boolean
  hideArrow?: boolean
  show?: boolean
}

export const GuideStep: React.FC<Props> = ({
  guide,
  step,
  placement,
  instructions,
  autoNext,
  autoStart,
  highlight,
  hideArrow,
  show,
  children,
}) => {
  const { ui } = useDispatch<Dispatch>()
  const state: IGuide = useSelector((state: ApplicationState) => state.ui[guide])
  const css = useStyles({ highlight })
  const open = state.step === step || !!show
  const start = () => ui.guide({ guide, step })

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
          <Typography variant="caption">
            {step} of {state.total}
          </Typography>
        </>
      }
    >
      <Box className={css.box} onClick={() => autoNext && ui.guide({ guide, step: step + 1 })}>
        {!state.step && step === 1 && (
          <IconButton
            icon="sparkles"
            title={state.title || 'Start guide'}
            onClick={start}
            color={state.done ? 'grayLight' : 'guide'}
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
  tip: {
    backgroundColor: colors.guide,
    color: colors.white,
    fontSize: fontSizes.lg,
    padding: spacing.lg,
    paddingRight: spacing.xxl,
    position: 'relative',
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
