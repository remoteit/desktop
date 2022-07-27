import React from 'react'
import { Icon } from '../../components/Icon'
import { Link } from '@mui/material'

export function NotFoundPage() {
  return (
    <div className="center mx-auto my-lg" style={{ maxWidth: '600px' }}>
      <Icon name="thumbs-down" size="xxxl" color="danger" />
      <h2 className="mt-md">Page Not Found</h2>
      <p className="lh-md gray-dark">
        Sorry, but we could not find the page you are looking for. Please try again or contact support{' '}
        <Link href="mailto:support@remote.it">support@remote.it</Link>.
      </p>
    </div>
  )
}
