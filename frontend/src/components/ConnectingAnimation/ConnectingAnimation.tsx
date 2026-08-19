import React, { useState } from 'react'
import { useInterval } from '../../hooks/useInterval'

export const ConnectingAnimation: React.FC<{ word: string }> = ({ word, ...props }) => {
  const [display, setDisplay] = useState<string>('')
  const [count, setCount] = useState<number>(0)

  useInterval(() => {
    const progress = Math.floor(count)
    let shuffle = word.substring(0, progress)
    for (let i = word.length - progress - 1; i >= 0; i--) {
      shuffle += word[Math.floor(Math.random() * word.length)]
    }
    if (progress < word.length) {
      console.log(progress)
      setCount(count + 1)
    }
    setDisplay(shuffle)
  }, 30)

  return <div {...props}>{display}</div>
}
