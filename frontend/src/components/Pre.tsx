import React from 'react'

export const Pre: React.FC<ILookup<any>> = props => {
  console.log('PRE OUTPUT', props)
  return (
    <>
      {Object.keys(props).map(key => (
        <pre key={key}>
          {key}: {`\n${JSON.stringify(props[key], null, 2)}\n\n`}
        </pre>
      ))}
    </>
  )
}
