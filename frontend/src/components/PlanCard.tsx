import React from 'react'
import { makeStyles, Typography, List, ListItem, ListItemIcon, Divider, Button } from '@material-ui/core'
import { spacing, fontSizes, colors, radius } from '../styling'
import { Icon } from './Icon'

type Props = {
  name: string
  description: string
  price?: number
  caption: string | React.ReactElement
  feature: string
  features: string[]
  button: string
  allowUpdate?: boolean
  selected?: boolean
  loading?: boolean
  onSelect?: () => void
}

export const PlanCard: React.FC<Props> = ({
  name,
  description,
  price,
  caption,
  feature,
  features = [],
  button,
  allowUpdate,
  selected,
  loading,
  onSelect,
}) => {
  const css = useStyles()
  return (
    <div className={selected ? css.selected : undefined}>
      {selected && <header>Current plan</header>}
      <div className={css.plan}>
        <Typography variant="h2">{name}</Typography>
        <Typography variant="caption">{description}</Typography>
      </div>
      <Divider flexItem variant="inset" />
      <div className={css.price}>
        {price !== undefined && <Typography variant="h1">${price}</Typography>}
        <Typography variant="body2">{caption}</Typography>
        <Button
          onClick={onSelect}
          size="small"
          color="primary"
          variant={'contained'}
          disabled={loading || (selected && !allowUpdate)}
        >
          {selected && !allowUpdate
            ? 'Current Plan'
            : loading
            ? 'Processing...'
            : selected && allowUpdate
            ? 'Update'
            : button}
        </Button>
      </div>
      <div className={css.features}>
        {/* <Typography variant="body2">Features:</Typography> */}
        <List dense>
          <Item>
            <b>{feature}</b>
          </Item>
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

const useStyles = makeStyles({
  selected: {
    backgroundColor: colors.primaryHighlight,
    borderRadius: radius,
    overflow: 'hidden',
    position: 'relative',
    '& .MuiDivider-root': { backgroundColor: colors.primaryLighter },
    '& header': {
      width: '100%',
      position: 'absolute',
      textTransform: 'uppercase',
      textAlign: 'center',
      backgroundColor: colors.primaryLight,
      letterSpacing: spacing.xxs,
      fontSize: fontSizes.xxxs,
      color: colors.white,
      fontWeight: 600,
      lineHeight: 2,
    },
  },
  plan: {
    padding: spacing.md,
    paddingTop: spacing.xxl,
    textAlign: 'center',
    '& h2': {
      textTransform: 'capitalize',
      fontSize: fontSizes.lg,
    },
  },
  price: {
    padding: spacing.md,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    '& .MuiButton-root': { marginTop: spacing.sm },
  },
  features: {
    paddingBottom: spacing.lg,
    color: colors.grayDarker,
    fontSize: fontSizes.sm,
    maxWidth: 250,
    lineHeight: 1.3,
    '& b': { fontWeight: 400, color: colors.grayDarkest },
    '& .MuiListItemIcon-root': { minWidth: 40 },
  },
})
