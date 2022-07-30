import React from 'react'
import { Route, RouteProps } from 'react-router-dom'

type Props = RouteProps & {
  paths: string[]
}

export const RouteArray: React.FC<Props> = ({ paths, children, ...props }) => {
  return (
    <>
      {paths.map(path => (
        <Route key={path} path={path} {...props}>
          {children}
        </Route>
      ))}
    </>
  )
}
