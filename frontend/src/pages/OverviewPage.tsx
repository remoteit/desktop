import React, { useEffect } from 'react'
import { Dispatch, ApplicationState } from '../store'
import { Typography, List } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { selectOwner } from '../models/organization'
import { getRemoteitLicense } from '../models/licensing'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import analyticsHelper from '../helpers/analyticsHelper'
import { AccordionMenuItem } from '../components/AccordionMenuItem'
import { DesktopUI } from '../components/DesktopUI'

export const OverviewPage: React.FC = () => {
  const { organization, license, owner } = useSelector((state: ApplicationState) => ({
    organization: state.organization,
    license: getRemoteitLicense(state),
    owner: selectOwner(state),
  }))
  const [removing, setRemoving] = React.useState<boolean>(false)
  const dispatch = useDispatch<Dispatch>()
  const enterprise = !license?.plan?.billing

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
      <DesktopUI>

        <AccordionMenuItem subtitle="Account deletion" gutters></AccordionMenuItem>
      </DesktopUI>

    </Container>
  )
}
