import React, { useState } from 'react'
import { useInterval } from '../../hooks/useInterval'
import { makeStyles } from '@material-ui/core/styles'

export const ConnectingAnimation: React.FC<{ word: string }> = ({ word, ...props }) => {
  const css = useStyles()
  const [display, setDisplay] = useState<string>('')
  const [count, setCount] = useState<number>(0)

  useInterval(() => {
    const progress = Math.floor(count)
    let shuffle = word.substr(0, progress)
    for (let i = word.length - progress - 1; i >= 0; i--) {
      shuffle += word[Math.floor(Math.random() * word.length)]
    }
    if (progress < word.length) {
      console.log(progress)
      setCount(count + 1)
    }
    setDisplay(shuffle)
  }, 30)

  return (
    <div className={css.display} {...props}>
      {display}
    </div>
  )
}

const useStyles = makeStyles({
  display: {},
})
