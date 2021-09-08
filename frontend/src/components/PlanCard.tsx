import React from 'react'
import { makeStyles, Typography, List, ListItem, ListItemIcon, Collapse, Button } from '@material-ui/core'
import { spacing, fontSizes, colors } from '../styling'
import { Icon } from './Icon'

type Props = {
  name: string
  description: string
  price?: number
  caption: string | React.ReactElement
  feature: string
  features: string[]
  button: string
  selected?: boolean
  loading?: boolean
  showChildren?: boolean
  onClick?: () => void
}

export const PlanCard: React.FC<Props> = ({
  name,
  description,
  price,
  caption,
  feature,
  features = [],
  button,
  selected,
  loading,
  showChildren,
  onClick,
  children,
}) => {
  const css = useStyles()
  // const dispatch = useDispatch<Dispatch>()

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
          onClick={() => onClick && onClick()}
          size="small"
          color="primary"
          variant={selected ? 'outlined' : 'contained'}
          disabled={loading || selected}
        >
          {loading ? 'Processing...' : selected ? 'Selected' : button}
        </Button>
      </div>
      <Collapse in={showChildren} timeout={400}>
        {children}
      </Collapse>
      <Collapse in={!showChildren} timeout={400}>
        <div className={css.features}>
          <Item>{feature}</Item>
          <Typography variant="body2">Features:</Typography>
          <List dense>
            {features.map((f, index) => (
              <Item key={index}>{f}</Item>
            ))}
          </List>
        </div>
      </Collapse>
    </div>
  )
}

export const Item: React.FC = ({ children }) => {
  return (
    <ListItem disableGutters dense>
      <ListItemIcon>
        <Icon name="check" color="success" />
      </ListItemIcon>
      {children}
    </ListItem>
  )
}

const useStyles = makeStyles({
  plan: {
    backgroundColor: colors.grayLightest,
    padding: spacing.md,
    textAlign: 'center',
    '& h2': {
      textTransform: 'capitalize',
    },
  },
  price: {
    padding: spacing.md,
    textAlign: 'center',
    // display: 'flex',
  },
  features: {},
})
