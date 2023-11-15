import React from 'react'
import ReCAPTCHA from 'reaptcha'
import { RECAPTCHA_SITE_KEY } from '../../../constants'

export type CaptchaProps = {
  id?: string
  onVerify: () => void
}

export function Captcha({ ...props }: CaptchaProps): JSX.Element {
  return <ReCAPTCHA sitekey={RECAPTCHA_SITE_KEY} {...props} />
}
