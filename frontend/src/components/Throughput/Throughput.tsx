import React, { useState, useEffect } from 'react'
import Controller from '../../services/Controller'
import { Icon } from '../Icon'
import { REGEX_NUMERIC_VALUE } from '../../constants'
import fileSize from 'filesize'
import { makeStyles } from '@material-ui/styles'
import { spacing } from '../../styling'

interface Props {
  connection: IConnection
}

export const Throughput: React.FC<Props> = ({ connection, ...props }) => {
  const [sent, setSent] = useState<number>(0)
  const [received, setReceived] = useState<number>(0)
  const css = useStyles()

  useEffect(() => {
    Controller.on('service/throughput', (message: ConnectionMessage) => {
      if (message.connection.id === connection.id && message.raw) {
        const [s, r] = parse(message.raw)
        setSent(s)
        setReceived(r)
      }
    })

    return function cleanup() {
      Controller.off('service/throughput')
    }
  }, [connection])

  return (
    <div className={css.data + ' hoverHide'} {...props}>
      <span>
        <Icon name="arrow-up" color={sent ? 'primary' : 'gray'} weight="solid" size="sm" />
        {fileSize(sent)}ps
      </span>
      <span>
        <Icon name="arrow-down" color={received ? 'primary' : 'gray'} weight="solid" size="sm" />
        {fileSize(received)}ps
      </span>
    </div>
  )
}

// raw example "!!throughput txBps=5 rxBps=4 pl=100000"
function parse(raw: string) {
  const parts = raw.split(' ')
  const sent = parsePart(parts[1])
  const received = parsePart(parts[2])
  return [sent, received]
}

const parsePart = (part: string) => {
  const match = part.match(REGEX_NUMERIC_VALUE)
  return match ? +match[1] : 0
}

const useStyles = makeStyles({
  data: {
    zIndex: -100,
    marginRight: spacing.md,
    '&>span': {
      marginRight: spacing.md,
    },
    '&>span>span': {
      marginRight: spacing.xs,
    },
  },
})
