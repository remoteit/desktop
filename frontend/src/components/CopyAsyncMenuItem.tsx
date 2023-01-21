import React from 'react'
import { CopyMenuItem, CopyMenuItemProps } from './CopyMenuItem'
import sleep from '../services/sleep'

type Props = CopyMenuItemProps & {
  request: () => Promise<string>
}

export const CopyAsyncMenuItem: React.FC<Props> = ({ icon, request, ...props }) => {
  const [value, setValue] = React.useState<string>()
  const [loading, setLoading] = React.useState<boolean>(false)

  async function onClick() {
    setLoading(true)
    const result = await request()
    setValue(result)
    await sleep(100)
    setLoading(false)
  }

  return (
    <CopyMenuItem
      icon={loading ? 'spinner' : icon}
      iconProps={{ spin: loading }}
      value={value}
      awaitCopy={onClick}
      {...props}
    />
  )
}
