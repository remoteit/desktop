import React from 'react'
import logo from './advantech-color.png'
import platforms from '..'

const Component = props => {
  return <img src={logo} alt="Advantech" {...props} />
}

platforms.register({
  id: 'advantech',
  name: 'Advantech',
  component: Component,
  types: { 1206: 'Advantech' },
})
