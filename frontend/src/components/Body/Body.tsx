import React, { Props } from 'react'
import styles from './Body.module.css'
import classnames from 'classnames'

export interface BodyProps
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  withSearch?: boolean
}

export function Body(props: BodyProps) {
  const css = classnames(
    props.className,
    styles.body,
    props.withSearch && styles.withSearch
  )
  return <div className={css}>{props.children}</div>
}
