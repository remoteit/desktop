import React, { useEffect } from 'react'
import { Dispatch, ApplicationState } from '../store'
import { Typography, List, Box, Grid, Button, ListItemText, ListItemIcon, ListItem } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import analyticsHelper from '../helpers/analyticsHelper'
import { AccordionMenuItem } from '../components/AccordionMenuItem'
import { DesktopUI } from '../components/DesktopUI'
import { Avatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { TextBlock } from '../components/TextBlock'

export const OverviewPage: React.FC = () => {

  const { user } = useSelector((state: ApplicationState) => state.auth)

  useEffect(() => {
    analyticsHelper.page('OverviewPage')
  }, [])

  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1">
            <Title>Overview</Title>

          </Typography>

        </>
      }
    >
      <Box m={4} marginBottom={0} pt={4}>
        <Box style={{
          height: '100%',
          padding: 0,
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Box>
            <Avatar size={150}></Avatar> <br></br>
            <Button variant='text' color='primary' style={{ padding: '0px 30px' }} size='small'> Change Photo </Button>
          </Box>

        </Box>


        <List>
          <InlineTextFieldSetting
            icon="at"
            value={user?.email}
            label="EMAIL"
            disabled={false}
            resetValue={user?.email}
            onSave={(e) => { }}
          />
          <InlineTextFieldSetting
            icon="language"
            value='English'
            label='LENGUAJE PREFERENCE'
            disabled={false}
            resetValue={user?.email}
            onSave={(e) => { }}
          />
          <AccordionMenuItem subtitle="Account deletion" gutters >
            <DeleteAccountSection email={user?.email} paidPlan={false} />
          </AccordionMenuItem>
        </List>




      </Box>

    </Container>
  )
}



interface DeleteAccountSectionProps {
  email?: string
  paidPlan?: boolean
}

function DeleteAccountSection({ email, paidPlan = false }: DeleteAccountSectionProps): JSX.Element {
  // TODO: Allow them to delete even if on a paid plan (downgrade their plan for them)
  const deleteAccount = () => {
    window.location.href = encodeURI(
      `mailto:support@remote.it?subject=Delete my remote.it account&body=Please delete my account: ${email} \n\nI understand that this is permanent and that accounts and related devices can not be recovered.`
    )
  }
  return (
    <Box m={4} >
      <Box pt={2} pb={2}>
        <Typography variant='body2'>
          If you no longer want/need your remote.it account, you can request an account deletion. Once your delete request
          is processed, all your account information is removed permanently.
        </Typography>
      </Box>
      {paidPlan ? (
        <div className="df ai-center bg-warning-lightest warning-dark my-lg px-lg py-md">
          <Icon name="exclamation-triangle" className="mr-md txt-lg" />
          <strong>
            You have a paid subscription plan. Please delete or transfer your devices before making an account deletion request.
          </strong>
        </div>
      ) : (
        <Box pb={2}>
          <Button style={{ color: 'red', borderColor: 'red', borderRadius: 3 }} variant='outlined' onClick={deleteAccount}>Delete my account</Button>
        </Box>
      )}
      <Typography variant='caption'>
        Deletion requests take 3 to 5 business days to complete.
      </Typography>
    </Box>
  )
}
