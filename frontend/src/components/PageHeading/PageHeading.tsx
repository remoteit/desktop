import React from 'react'

export interface Props {
  children: React.ReactNode
}

export function PageHeading({
  children,
  className,
}: Props & React.HTMLProps<HTMLDivElement>) {
  return (
    <div className={className}>
      <h3 className="txt-md fw-4 upper ls-lg gray-darkest my-none">
        {children}
      </h3>
    </div>
  )
}
