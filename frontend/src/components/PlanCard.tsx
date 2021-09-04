import React from 'react'
import { Gutters } from './Gutters'
import {
  makeStyles,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  TextField,
  Collapse,
  Button,
} from '@material-ui/core'
import { REMOTEIT_PRODUCT_ID } from '../models/licensing'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { spacing, fontSizes, colors } from '../styling'
import { Icon } from './Icon'

type Props = {
  name: string
  description: string
  price?: number
  caption: string
  feature: string
  features: string[]
}

export const PlanCard: React.FC<Props> = ({ name, description, price, caption, feature, features = [], children }) => {
  const css = useStyles()
  // const dispatch = useDispatch<Dispatch>()
  const { subscription, purchasing } = useSelector((state: ApplicationState) => ({
    subscription: state.licensing.license,
    purchasing: state.licensing.purchasing,
  }))

  return (
    <div>
      <div className={css.plan}>
        <Typography variant="h2">{name}</Typography>
        <Typography variant="caption">{description}</Typography>
      </div>
      <div className={css.price}>
        {price !== undefined && <Typography variant="h1">${price}</Typography>}
        <Typography variant="body2">{caption}</Typography>
        <Button
          onClick={() => console.log('purchase')}
          size="small"
          color="primary"
          variant="contained"
          disabled={purchasing}
        >
          {purchasing ? 'Processing...' : 'Purchase'}
        </Button>
      </div>
      <div className={css.features}>
        <Item>{feature}</Item>
        <Typography variant="body2">Features:</Typography>
        <List dense>
          {features.map((f, index) => (
            <Item key={index}>{f}</Item>
          ))}
        </List>
      </div>
    </div>
  )
}

export const Item: React.FC<{ key?: string | number }> = ({ key, children }) => {
  return (
    <ListItem key={key} disableGutters dense>
      <ListItemIcon>
        <Icon name="check" color="success" />
      </ListItemIcon>
      {children}
    </ListItem>
  )
}

const useStyles = makeStyles({
  plan: {
    // display: 'flex',
    backgroundColor: colors.grayLightest,
    padding: spacing.md,
    textAlign: 'center',
  },
  price: {
    padding: spacing.md,
    textAlign: 'center',
    // display: 'flex',
  },
  features: {},
})
