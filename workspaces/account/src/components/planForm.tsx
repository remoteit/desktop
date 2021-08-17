import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Link, TextField, Typography } from '@material-ui/core'
import { Dispatch, ApplicationState} from '../store'
import { EditButton } from '../buttons/EditButton'
import { Icon } from './Icon'
import { SaveButton } from '../buttons/SaveButton'


export interface Props {
    label: string
    initialValue: number
    planName: string,
    name: string
}

export const PlanForm : React.FC<Props> = ( { label, initialValue, planName, name} ) => {

  const { user, stripeCard} = useSelector((state: ApplicationState) => ({ 
     user: state.auth.user,
     loading: state.auth.loading,
     stripeCard: state.auth.stripeCard,
    }))
  
  const dispatch = useDispatch<Dispatch>()
  const { changePlan,  } = dispatch.auth
  const [showDowngrade, setShowDowngrade] = React.useState<boolean>(false)
  const [showCard, setShowCard] = React.useState<boolean>(false)
  const [quantity, setQuantity] = useState<number>(initialValue)

  let priceCents = planName === 'Personal' ? 0 : planName === 'Professional' ? 2 * 100 : 50 * 100
  const total = (quantity * priceCents) / 100

  let isUpdate = !!(stripeCard && stripeCard.id)
  if (!user) return null


  const onChangePlan = () => {
    setShowDowngrade(false)
     changePlan({
         type: name,
         quantity,
         token : ''
     })
  }

  return (
    <div>
        
        { showDowngrade && (
            <Box p={2} style= {{ maxWidth: 500}} >
                <Box textAlign="right">
                    <Link>
                        <Icon
                            name="times"
                            onClick={() => setShowDowngrade(false)}
                            color="gray"
                            className="txt-xl c-pointer"
                        />
                    </Link>
                </Box>
                
                <Box m={1}>
                <TextField 
                    type="number" 
                    style={{ maxWidth: 80 }}
                    onChange={e => setQuantity(Number(e.target.value))}
                    value={quantity}
                ></TextField>
                <strong style={{ marginLeft: 10}}>${priceCents / 100}/month</strong>{' '}= <strong>${total}/month</strong>
                </Box>
                <Box>
                    
                    <Box pt={2} pb={2}>
                        <Typography><Icon name="credit-card" /> Payment method:</Typography>
                    </Box>
                    
                    { showCard ? (
                        <Typography variant="body2">
                            {stripeCard && stripeCard.brand} ending in {stripeCard && stripeCard.lastFour}
                             (<Link style={{fontWeight: 'bold'}} onClick={() => setShowCard(false)}>Hide</Link>)
                        </Typography>
                    ): (
                        isUpdate ? (
                            <Typography variant="body2">Credit card information hidden  (<Link style={{fontWeight: 'bold'}} onClick={() => setShowCard(true)}>Show</Link>)</Typography>
                        ) : (
                            <span style={{fontWeight: 'bold'}}>No credit card saved <a>Add Card</a></span>
                        )
                    )}
                </Box>
            </Box>
        )}
        { !showDowngrade 
            ? (<EditButton label={label} onclick={() => setShowDowngrade(true)}/>)
            : (<SaveButton label="Confirm Payment" onClick={onChangePlan} />)
        }

    </div>
  )
}
