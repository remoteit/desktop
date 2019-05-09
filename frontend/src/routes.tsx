import React from 'react'
import { SignInFormController } from './controllers/SignInFormController'
import { SplashScreenPage } from './components/SplashScreenPage'
import { DevicePageController } from './controllers/DevicePageController'

export const routes = {
  '/': () => <DevicePageController />,
  '/config': () => <SplashScreenPage />,
  '/sign-in': () => <SignInFormController />,
  // '/products/:id': ({id}) => <ProductDetails id={id} />
}
