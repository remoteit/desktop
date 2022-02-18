import React from 'react'

export const Axis = props => {
  return (
    <svg viewBox="0 0 60 47" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill="currentColor" fillRule="nonzero">
        <polygon points="29.472 0 11.771 27.605 27.669 27.604 39.327 45.947 58.969 45.947"></polygon>
        <polygon points="24.049 29.114 10.803 29.114 0 45.947 34.852 45.947"></polygon>
      </g>
    </svg>
  )
}

export const AxisOutline = props => {
  return (
    <svg viewBox="0 0 66 51" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g stroke="currentColor" strokeWidth="1" fill="currentColor" fillRule="evenodd">
        <path d="M32.992,0.281 L65.252,50.529 L0.761,50.529 L13.214,31.125 L32.992,0.281 Z M32.993,3.074 L15.292,30.679 L31.19,30.678 L42.848,49.021 L62.49,49.021 L32.993,3.074 Z M27.57,32.188 L14.324,32.188 L3.521,49.021 L38.373,49.021 L27.57,32.188 Z"></path>
      </g>
    </svg>
  )
}
