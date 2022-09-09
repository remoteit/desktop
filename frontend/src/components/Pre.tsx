import React from 'react'

export const Pre: React.FC<ILookup<any>> = props => {
  return (
    <>
      {Object.keys(props).map(key => (
        <pre key={key}>
          {key}: {`\n${JSON.stringify(props[key])}\n\n`}
        </pre>
      ))}
    </>
  )
}
