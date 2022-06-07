import React from 'react'
import platforms from '..'

const Icon = ({ darkMode, ...props }) => {
  const light = darkMode ? '#444' : '#bbb'
  const gray = '#808080'
  return (
    <svg viewBox="0 0 640 590" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g>
        <path
          d="M528,0 L112,0 C85.5222466,0.076890871 64.0768909,21.5222466 64,48 L64,384 L576,384 L576,48 C575.923109,21.5222466 554.477753,0.076890871 528,0 Z"
          id="bezel"
          fill={gray}
        ></path>
        <polygon id="screen" points="512 320 128 320 128 64 512 64" fill={light}></polygon>
        <path
          d="M624,416 L381.54,416 C380.8,435.81 366.83,448 348.8,448 L288,448 C269.31,448 255,430.53 255.23,416 L16,416 C7.163444,416 0,423.163444 0,432 L0,448 C0.104341566,483.302914 28.697086,511.895658 64,512 L576,512 C611.302914,511.895658 639.895658,483.302914 640,448 L640,432 C640,423.163444 632.836556,416 624,416 L624,416 Z"
          id="keyboard"
          fill={gray}
        ></path>
      </g>
    </svg>
  )
}

platforms.register({
  id: 'this',
  name: 'This system',
  component: Icon,
})
