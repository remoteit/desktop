import React from 'react'
import { SignInController } from './controllers/SignInController'
import { SplashScreenPage } from './components/SplashScreenPage'
import { DevicePageController } from './controllers/DevicePageController'

export const routes = {
  '/': () => <DevicePageController />,
  '/config': () => <SplashScreenPage />,
  '/sign-in': () => <SignInController />,
  // '/products/:id': ({id}) => <ProductDetails id={id} />
}
