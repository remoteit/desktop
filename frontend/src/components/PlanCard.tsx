import React from 'react'
import { Gutters } from './Gutters'
import {
  makeStyles,
  Typography,
  List,
  ListItem,
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
  price: number
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
    <Gutters>
      <div className={css.plan}>
        <Typography variant="h2">{name}</Typography>
        <Typography variant="body2">{description}</Typography>
      </div>
      <div className={css.price}>
        <Typography variant="h1">${price}</Typography>
        <Typography variant="body2">{caption}</Typography>
        <Button onClick={() => console.log('purchase')} color="primary" variant="contained" disabled={purchasing}>
          {purchasing ? 'Processing...' : 'Purchase'}
        </Button>
      </div>
      <div className={css.features}>
        {feature}
        Features:
        {features.map((f, index) => (
          <li key={index}>
            <Icon name="check" color="success" />
            {f}
          </li>
        ))}
      </div>
    </Gutters>
  )
}

const useStyles = makeStyles({
  plan: {
    // display: 'flex',
  },
  price: {
    // display: 'flex',
  },
  features: {},
})
