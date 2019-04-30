import React from 'react'
import { SignInController } from './controllers/SignInController'
import { SplashScreenPage } from './components/SplashScreenPage'
import { DeviceListController } from './controllers/DeviceListController'

export const routes = {
  '/': () => <DeviceListController />,
  '/config': () => <SplashScreenPage />,
  '/sign-in': () => <SignInController />,
  // '/products/:id': ({id}) => <ProductDetails id={id} />
}
