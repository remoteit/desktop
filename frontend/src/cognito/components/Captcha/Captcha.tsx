import React from 'react'
import ReCAPTCHA from 'reaptcha'

const SITE_KEY = String(process.env.RECAPTCHA_SITE_KEY || '6Ldt3W4UAAAAAFtJAA4erruG9zT9TCOulJHO4L5e')

export type CaptchaProps = {
  id?: string
  onVerify: () => void
}

export function Captcha({ ...props }: CaptchaProps): JSX.Element {
  return <ReCAPTCHA sitekey={SITE_KEY} {...props} />
}
