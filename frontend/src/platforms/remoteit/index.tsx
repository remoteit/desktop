import React from 'react'
import platforms from '..'

const Component = ({ darkMode, ...props }) => {
  const wifi = darkMode ? '#034B9C' : '#034B9C'
  const r3 = '#1699D6'
  return (
    <svg viewBox="0 0 608 717" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g>
        <path
          fill={wifi}
          d="M302.7,0 C364.1,0.6 417.7,12 468,37.8 C487.9,48.1 506.6,60.6 523.7,75 C535,84.4 533.6,100.5 521,108.7 C508.4,116.9 491.2,116.2 478.3,106.7 C468.4,99.5 458.9,91.7 448.5,85.4 C398.1,54.8 343.3,44.2 285.1,48.4 C251.5,50.8 218.6,59.4 188.2,73.9 C170.1,82.5 153.5,93.7 138,106.4 C131,112.1 124,117.8 114.8,119.2 C103.2,121 92.9,118.3 84.3,110.1 C76,102.2 75.6,91.1 83.5,82.7 C87.1,78.8 91.7,75.7 95.8,72.3 C118.7,53.6 144.2,38.3 171.5,26.9 C204,13.3 238.3,5 273.4,2 C284.9,1 296.4,0.4 302.7,0 Z"
        ></path>
        <path
          fill={wifi}
          d="M307.5,84.4 C358.8,84.5 404.3,100.3 443.5,133.7 C456,144.3 455,160.7 441.3,169.8 C427,179.2 408.9,178.6 394.5,168.1 C390.7,165.3 387,162.3 383.1,159.5 C337.3,126.1 272.4,127.4 227.8,162.6 C222.7,166.7 217.5,170.7 212.1,174.4 C198.7,183.6 177.3,182.4 165.5,172 C154.5,162.3 153.8,148.2 165.1,138.7 C186.3,120.9 208.9,105.1 235.6,96.2 C258.8,88.3 283.1,84.4 307.5,84.4 Z"
        ></path>
        <path
          fill={wifi}
          d="M305.4,176.8 C342.5,177.2 363.8,209.4 363.1,238.2 C362.3,272.2 335.5,298.5 303.2,297.4 C269.5,296.2 245.3,269.6 246.1,234.6 C246.9,202.2 273.6,176.1 305.4,176.8 Z"
        ></path>
        <path
          fill={r3}
          d="M526.9,487.5 L528.7,399.5 L517.9,399.5 C445.3,399.5 372.7,399.3 300.1,399.8 C294.9,399.9 289.7,398.8 285,396.5 C277,392.5 272.2,385.5 269.4,379.7 C269.5,369.2 269.5,358.6 269.6,348.1 C270,347.1 270.4,346 270.8,345 C274.7,336.5 281.6,331.6 286.6,328.8 L589.5,328 C591.9,329.1 594.2,330.5 596.2,332.3 C597.9,333.9 599.4,335.7 600.7,337.6 C603.4,341.1 604.8,342.8 605.7,345.1 C606.8,348 607.4,351.2 607.3,354.3 C607.2,445 607.1,535.8 607.2,626.5 C607.2,645.7 602.4,663.5 590.9,679.2 C578.9,695.5 562.2,704.7 543.1,709.9 C529.3,713.7 515.1,715.7 500.9,715.8 C463.8,714.9 391.5,715.3 294.7,715.8 C292,715.5 289.3,714.9 286.7,713.9 C280.8,711.5 275.8,707.4 272.2,702.2 L270.6,695.2 L269.4,666.2 L273.4,655.7 C277.5,649.7 284,645.8 291.3,645.1 L386.8,644.7 L483,644.3 C491.3,644.7 499.6,644 507.7,642 C518.3,639.3 521.3,636.3 522.2,635.3 C527.9,629.1 527.5,620.5 527.3,617.7 L527.3,557.7 L518.1,557.3 C398.1,559.8 310.6,560.5 297.1,559.3 C291.8,558.9 286.6,557.2 282.1,554.3 C277.2,550.9 273.3,546.1 271,540.6 L271.1,508.3 C270.7,506.3 270.7,504.3 271.1,502.3 C273,492.1 284.5,487.5 285.9,487 L526.9,487.5 Z"
        ></path>
        <path
          fill={r3}
          d="M86.6,341.4 L86.8,369.5 C95.6,358.1 106.6,348.7 119.1,341.7 C126.4,337.8 134.1,334.7 142.1,332.5 C147.5,331 153,329.9 158.5,329.2 C168.4,327.8 178.5,327.2 188.5,327.6 L208.3,329.2 L209.3,404.9 L198.4,410.1 C187.9,409.6 179.2,409.8 172.8,410 C158.2,410.6 150.4,410.9 140.2,413.8 C134.3,415.5 126.7,417.7 118.1,423.3 C108.9,429.4 101.3,437.6 96,447.3 C90.2,458.3 89.3,468.3 88.3,479.5 C87.7,485.4 87.6,491.4 87.9,497.3 C88.7,513.8 88.6,578.7 87.2,705.2 L79,715.7 L76.4,716.4 L9.9,716.7 L1,706.4 L0,702.8 L0,340.1 L9.2,332.9 L76.3,332.2 L86.6,341.4 Z"
        ></path>
      </g>
    </svg>
  )
}

platforms.register({
  id: 'remoteit',
  name: 'Remote.It',
  component: Component,
})
