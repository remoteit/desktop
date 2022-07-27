import React from 'react'
import classnames from 'classnames'
import { makeStyles } from '@mui/styles'
import { Typography, List, ListItem, ListItemIcon, Divider, Button } from '@mui/material'
import { spacing, fontSizes, radius } from '../styling'
import { Icon } from './Icon'

type Props = {
  name: string
  description: string
  price?: string
  caption: React.ReactNode
  note?: string
  features?: string[]
  button: string
  disabled?: boolean
  selected?: boolean
  loading?: boolean
  wide?: boolean
  onSelect?: () => void
}

type StyleProps = {
  wide?: boolean
}

export const PlanCard: React.FC<Props> = ({
  name,
  description,
  price,
  caption,
  note,
  features = [],
  button,
  disabled,
  selected,
  loading,
  wide,
  onSelect,
}) => {
  const css = useStyles({ wide })
  return (
    <div className={classnames(css.card, selected && css.selected)}>
      {selected && <header>Current plan</header>}
      <div className={css.plan}>
        <Typography variant="h2">{name}</Typography>
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
  card: ({ wide }: StyleProps) => ({
    display: 'flex',
    width: '100%',
    maxWidth: wide ? 600 : 280,
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    '& .planCardColumn': {
      display: wide ? 'flex' : 'block',
      '& > div + div': { marginLeft: wide ? spacing.md : undefined },
    },
  }),
  selected: {
    backgroundColor: palette.primaryHighlight.main,
    borderRadius: radius,
    overflow: 'hidden',
    position: 'relative',
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
  plan: {
    padding: spacing.md,
    paddingTop: spacing.xxl,
    textAlign: 'center',
    '& h2': { textTransform: 'capitalize' },
  },
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
  features: {
    paddingBottom: spacing.lg,
    color: palette.grayDarker.main,
    fontSize: fontSizes.sm,
    maxWidth: 250,
    lineHeight: 1.3,
    marginLeft: -spacing.md,
    '& b': { fontWeight: 400, color: palette.grayDarkest.main },
    '& .MuiListItemIcon-root': { minWidth: 40 },
  },
}))
