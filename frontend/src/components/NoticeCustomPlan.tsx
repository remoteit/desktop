import React from 'react'
import { Notice, NoticeProps } from './Notice'
import { Link } from './Link'

export const NoticeCustomPlan: React.FC<NoticeProps> = props => (
  <Notice severity="info" gutterTop {...props}>
    Your plan has a custom license
    <em>
      Please contact
      <Link href={encodeURI(`mailto:sales@remote.it?subject=Update custom licensing`)}>sales@remote.it</Link>for
      changes. Selecting another plan will revoke any special licensing.
    </em>
  </Notice>
)
