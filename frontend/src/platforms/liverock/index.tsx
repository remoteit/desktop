import React from 'react'
import { platforms } from '..'

const Component = ({ darkMode, ...props }) => {
  return (
    <svg viewBox="-10 -10 224 137" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
      <title>liverock</title>
      <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <path
          d="M188.280762,20.480375 C179.677825,20.480375 171.790262,24.4223125 170.58445,29.72125 C170.4812,30.126875 170.31895,30.326 170.31895,30.326 C169.7437,30.9123125 167.75245,31.174125 164.474262,31.388 L157.0292,31.8636875 C153.732575,32.05175 149.8607,30.9123125 147.8842,29.6880625 L136.917575,24.5550625 C134.384262,23.55575 132.651137,21.9148125 133.012512,20.2406875 L133.750012,16.8850625 C134.104012,15.3141875 136.744262,13.4630625 139.572575,12.6813125 C139.572575,12.6813125 148.54795,10.3213125 150.118825,6.6928125 C151.76345,2.898375 147.050825,0 139.709012,0 C132.363512,0 124.479637,2.898375 121.975825,6.6928125 C119.5937,10.3213125 126.013637,12.6813125 126.013637,12.6813125 C128.0307,13.4630625 128.6207,15.3141875 127.27845,16.8850625 L124.317387,20.2406875 C122.8682,21.9148125 119.007387,23.858125 115.725512,24.5550625 L99.2128875,29.669625 C95.986325,31.0524375 90.7980125,32.029625 87.7042,31.8194375 L81.0703875,31.3769375 C78.0171375,31.1409375 75.9005125,30.613625 76.3430125,30.185875 L76.678575,29.7986875 C81.206825,24.4886875 77.6705125,20.480375 69.0712625,20.480375 C60.4646375,20.480375 49.0887,24.4886875 43.314075,29.7986875 C37.15595,35.4848125 39.729825,40.4445 49.63445,40.4445 C56.8803875,40.4445 65.0887625,36.793875 65.0887625,36.793875 C68.669325,35.2119375 73.448325,34.633 75.7456375,35.4848125 L79.9198875,36.985625 C82.3093875,37.86325 82.7223875,40.0720625 80.7311375,41.941625 L79.3446375,43.7669375 C74.2558875,50.334375 75.631325,57.709375 75.631325,57.709375 C76.0701375,59.98825 73.5183875,64.0260625 69.893575,66.6663125 L62.7140125,71.9025625 C58.74995,74.8083125 54.0631375,76.0325625 50.3166375,75.6343125 C50.3166375,75.6343125 47.3961375,75.276625 46.9093875,75.343 C34.8438875,75.343 17.737575,83.249 7.8182,93.979625 C-3.22955,105.886562 -1.275175,116.59875 13.31995,116.59875 C27.959325,116.59875 47.3076375,105.886562 55.6561375,93.979625 C59.096575,88.964625 59.19245,85.483625 59.19245,85.483625 C59.28095,81.6818125 62.282575,78.167625 66.9067,75.704375 L74.480825,71.6555 C78.773075,69.3213125 84.6693875,68.447375 87.6747,69.612625 C87.6747,69.612625 92.918325,71.6665625 100.617825,71.6665625 C108.376325,71.6665625 115.939387,69.5794375 115.939387,69.5794375 C120.224262,68.4105 125.176575,69.2918125 126.98345,71.5706875 L130.073575,75.5089375 C132.024262,77.975875 130.75945,82.3676875 127.156762,85.2586875 C127.156762,85.2586875 123.572512,88.13125 121.371075,93.758375 C116.769075,105.657937 124.41695,116.344312 139.015762,116.344312 C153.625637,116.344312 167.243575,105.657937 169.190575,93.758375 C170.9237,83.0756875 162.4867,75.1549375 150.439637,75.1549375 L146.914387,75.1549375 C142.714325,75.4905 139.2997,74.5870625 138.495825,71.736625 L136.980262,66.56675 C136.21695,63.956 138.053325,59.92925 140.96645,57.6171875 C140.96645,57.6171875 150.266325,50.304875 152.346075,43.7669375 L152.895512,42.0043125 C153.00245,40.1679375 155.83445,37.9996875 159.193762,37.133125 L165.3187,35.584375 C168.574762,34.751 172.745325,35.35575 174.614887,36.91925 C174.614887,36.91925 178.855512,40.4445 186.038762,40.4445 C195.9102,40.4445 203.923137,35.4848125 203.923137,29.7986875 C203.923137,24.4886875 196.916887,20.480375 188.280762,20.480375"
          fill="#F2A35C"
        ></path>
      </g>
    </svg>
  )
}

platforms.register({
  id: 'liverock',
  name: 'Liverock Technologies',
  component: Component,
  types: { 1226: 'Liverock' },
})
