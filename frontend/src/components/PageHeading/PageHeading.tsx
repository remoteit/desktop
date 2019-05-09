import React from 'react'

export interface Props {
  children: React.ReactNode
}

export function PageHeading({ children }: Props) {
  return (
    <div className="center mb-md">
      <h3 className="txt-md fw-lighter upper ls-lg gray-dark my-none">
        {children}
      </h3>
    </div>
  )
}
