import React from 'react'
import { SignIn } from './components/SignIn'
import { SplashScreenPage } from './components/SplashScreenPage'

export const routes = {
  '/': () => <SplashScreenPage />,
  '/sign-in': () => <SignIn />,
  // '/products': () => <DevicePage />,
  // '/products/:id': ({id}) => <ProductDetails id={id} />
}
