import React from 'react'
import classnames from 'classnames'
import { makeStyles } from '@mui/styles'
import { MOBILE_WIDTH } from '../constants'
import { useMediaQuery, Typography, List, ListItem, ListItemIcon, Divider, Button } from '@mui/material'
import { spacing, fontSizes, radius } from '../styling'
import { Icon } from './Icon'

type Props = {
  name: string | React.ReactNode
  description: string
  price?: string
  caption: React.ReactNode
  note?: string
  features?: string[]
  button: string
  promoted?: boolean
  disabled?: boolean
  selected?: boolean
  loading?: boolean
  wide?: boolean
  onSelect?: () => void
}

type StyleProps = {
  wide?: boolean
  selected?: boolean
}

export const PlanCard: React.FC<Props> = ({
  name,
  description,
  price,
  caption,
  note,
  features = [],
  button,
  promoted,
  disabled,
  selected,
  loading,
  wide,
  onSelect,
}) => {
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  wide = wide && !mobile
  const css = useStyles({ wide, selected })

  return (
    <div className={classnames(css.card, selected ? css.selected : promoted && css.promoted)}>
      {selected ? <header>Current plan</header> : promoted && <header>New</header>}
      <div className={css.plan}>
        <Typography variant="h1">{name}</Typography>
        <Typography variant="caption">{description}</Typography>
      </div>
      <Divider flexItem variant="inset" />
      <div className="planCardColumn">
        <div>
          <div className={css.price}>
            {price !== undefined && <Typography variant="h1">{price}</Typography>}
            <Typography variant="body2">{caption}</Typography>
            {note !== undefined && <Typography variant="caption">{note}</Typography>}
          </div>
          <Button
            onClick={onSelect}
            size="small"
            color="primary"
            variant="contained"
            disabled={loading || disabled}
            className={css.select}
          >
            {loading ? 'Processing...' : button}
          </Button>
        </div>
        {!!features.length && (
          <div className={css.features}>
            <List dense>
              {features[0] && (
                <Item>
                  <b>{features[0]}</b>
                </Item>
              )}
              {features.map((f, index) => index > 0 && <Item key={index}>{f}</Item>)}
            </List>
          </div>
        )}
      </div>
    </div>
  )
}

export const Item: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <ListItem disableGutters dense>
      <ListItemIcon>
        <Icon name="check" color="primary" />
      </ListItemIcon>
      {children}
    </ListItem>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  card: ({ wide, selected }: StyleProps) => ({
    display: 'flex',
    width: '100%',
    maxWidth: 840,
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    borderRadius: radius,
    backgroundColor: selected ? palette.primaryHighlight.main : wide ? palette.grayLightest.main : undefined,
    '& .planCardColumn': {
      paddingBottom: spacing.lg,
      display: wide ? 'flex' : 'block',
      '& > div + div': { marginLeft: wide ? spacing.md : undefined },
    },
  }),
  selected: {
    borderRadius: radius,
    position: 'relative',
    overflow: 'hidden',
    '& .MuiDivider-root': { borderColor: palette.primaryLight.main },
    '& header': {
      width: '100%',
      position: 'absolute',
      textTransform: 'uppercase',
      textAlign: 'center',
      backgroundColor: palette.primaryLight.main,
      letterSpacing: spacing.xxs,
      fontSize: fontSizes.xxxs,
      color: palette.alwaysWhite.main,
      fontWeight: 600,
      lineHeight: 2,
    },
  },
  promoted: {
    position: 'relative',
    overflow: 'hidden',
    '& header': {
      width: 160,
      left: -40,
      top: 24,
      position: 'absolute',
      textTransform: 'uppercase',
      transform: 'rotate(-45deg)',
      backgroundColor: palette.danger.main,
      letterSpacing: spacing.xxs,
      fontSize: fontSizes.xs,
      color: palette.alwaysWhite.main,
      fontWeight: 600,
      lineHeight: 2.6,
    },
  },
  plan: ({ wide, selected }: StyleProps) => ({
    padding: spacing.md,
    paddingTop: wide && !selected ? spacing.xl : spacing.xxl,
    textAlign: 'center',
    '& h1': { textTransform: 'capitalize' },
  }),
  price: {
    padding: spacing.md,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    '& .MuiButton-root': { marginTop: spacing.sm },
  },
  select: {
    marginBottom: spacing.sm,
  },
  features: ({ wide }: StyleProps) => ({
    paddingRight: spacing.sm,
    color: palette.grayDarker.main,
    fontSize: fontSizes.sm,
    maxWidth: wide ? 440 : 200,
    lineHeight: 1.3,
    '& b': { fontWeight: 400, color: palette.grayDarkest.main },
    '& .MuiListItemIcon-root': { minWidth: 40 },
  }),
}))
