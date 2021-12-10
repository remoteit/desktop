import React from 'react'
import classnames from 'classnames'
import { makeStyles, Typography, List, ListItem, ListItemIcon, Divider, Button } from '@material-ui/core'
import { spacing, fontSizes, radius } from '../styling'
import { Icon } from './Icon'

type Props = {
  name: string
  description: string
  price?: string
  caption: string | React.ReactElement
  note?: string
  feature?: string
  features?: string[]
  button: string
  disabled?: boolean
  selected?: boolean
  loading?: boolean
  onSelect?: () => void
}

export const PlanCard: React.FC<Props> = ({
  name,
  description,
  price,
  caption,
  note,
  feature,
  features = [],
  button,
  disabled,
  selected,
  loading,
  onSelect,
}) => {
  const css = useStyles()
  return (
    <div className={classnames(css.card, selected && css.selected)}>
      {selected && <header>Current plan</header>}
      <div className={css.plan}>
        <Typography variant="h2">{name}</Typography>
        <Typography variant="caption">{description}</Typography>
      </div>
      <Divider flexItem variant="inset" />
      <div className={css.price}>
        {price !== undefined && <Typography variant="h1">{price}</Typography>}
        <Typography variant="body2">{caption}</Typography>
        {note !== undefined && <Typography variant="caption">{note}</Typography>}
      </div>
      <Button
        onClick={onSelect}
        size="small"
        color="primary"
        variant={'contained'}
        disabled={loading || disabled}
        className={css.select}
      >
        {loading ? 'Processing...' : button}
      </Button>
      <div className={css.features}>
        {/* <Typography variant="body2">Features:</Typography> */}
        <List dense>
          {feature && (
            <Item>
              <b>{feature}</b>
            </Item>
          )}
          {features.map((f, index) => (
            <Item key={index}>{f}</Item>
          ))}
        </List>
      </div>
    </div>
  )
}

export const Item: React.FC = ({ children }) => {
  return (
    <ListItem disableGutters dense>
      <ListItemIcon>
        <Icon name="check" color="primary" />
      </ListItemIcon>
      {children}
    </ListItem>
  )
}

const useStyles = makeStyles( ({ palette }) => ({
  card: { display: 'flex', width: '100%', maxWidth: 260, flexDirection: 'column', alignItems: 'center' },
  selected: {
    backgroundColor: palette.primaryHighlight.palette,
    borderRadius: radius,
    overflow: 'hidden',
    position: 'relative',
    '& .MuiDivider-root': { backgroundColor: palette.primaryLighter.main },
    '& header': {
      width: '100%',
      position: 'absolute',
      textTransform: 'uppercase',
      textAlign: 'center',
      backgroundColor: palette.primaryLight.main,
      letterSpacing: spacing.xxs,
      fontSize: fontSizes.xxxs,
      color: palette.white.main,
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
    '& b': { fontWeight: 400, color: palette.grayDarkest.main },
    '& .MuiListItemIcon-root': { minWidth: 40 },
  },
}))
