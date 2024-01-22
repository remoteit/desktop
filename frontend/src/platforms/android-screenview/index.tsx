import { Component } from '../screenview'
import { platforms } from '..'

platforms.register({
  id: 'android-screenview',
  name: 'Android ScreenView extension',
  hidden: true,
  component: Component,
  types: { 1213: 'Android ScreenView' },
  services: [{ application: 48 }],
  installation: {
    label: 'Registration Code',
    command: '[CODE]',
    qualifier: 'For Android ScreenView',
  },
})
