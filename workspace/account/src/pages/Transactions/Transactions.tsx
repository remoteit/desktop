import React, { useEffect } from 'react'
import { Box } from '@material-ui/core'

import { Section } from '../../components/Section'
import { TableTransaction } from '../../components/TableTransaction'
import { EditButton } from '../../buttons/EditButton'
import { useDispatch, useSelector } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'

export const Transactions = () => {

  const transactions = useSelector((state: ApplicationState) => state.auth.transactions )
  const [expanded, setExpanded] = React.useState<boolean>(false)

  //TO DO
  const { auth } = useDispatch<Dispatch>()

  useEffect(() => {
    auth.fetchTransactions()
  },[])
 

  return (
    <Section title="Transactions">
      <Box mt={4} pr={6}>
        <TableTransaction transactions={transactions} expanded={expanded}/>
      </Box>
      
      <Box mt={3}>
        <EditButton label={expanded ? 'Show less' : 'Show more'} onclick={() => setExpanded(!expanded)}/>
      </Box>
    </Section>
  )
}
