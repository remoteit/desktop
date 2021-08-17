


import React from 'react'
import { makeStyles } from '@material-ui/core'
import pattern from '../../assets/pattern.svg'
import trimble from '../../assets/trimble_logo.png'
import MHIECE from '../../assets/MHIECE_logo.png'
import bullseyeTelecom from '../../assets/bullseye-telecom_logo.png'
import karit from '../../assets/karit_logo.png'
import spanio from '../../assets/spanio_logo.png'
import colourfi from '../../assets/colourfi_logo.png'

import './SigninPage.css'
import { Header } from './header/Header'

export interface Props {
  children: React.ReactNode
  title?: string
  maxWidth?: string
}

export const trustedLogo =  [
  MHIECE,
  trimble,
  bullseyeTelecom,
  karit,
  spanio,
  colourfi,
]

export function SignInPage({ children }: Props): JSX.Element {
  const css = useStyles()

  return (
    <div className={css.body}>
      <Header/>
      <main >
        <section className={css.section}>
          <div className={css.container}>
            <div className={css.row}>
              <div  className={css.col_table}>
                  <h3 className={css.hdTitle}>Remote access made easy </h3>
                  <div className="b--card-a__bd b--content-a b--content-a--second">
                    <div className="">
                      <p>
                      <a href="http://remote.it/" target="_blank" rel="noopener">remote.it</a> 
                      helps businesses manage devices and share access to their resources easily and securely, 
                      no matter where their users are. Sign up now and connect one or thousands of devices.
                      </p>
                      
                    </div>
                  </div>
                  <div className={css.titleTrust}>
                      <div className={css.tTitle}>Trusted by</div>
                      <div className={css.row}>
                      { trustedLogo.map( (item, index) => {
                        return (
                        <div className={css.col} key={index}> 
                            <div className="">
                              <img className={css.img} src={item}/>
                            </div>
                        </div>)
                      })}
                      </div>
                </div>
              </div>
              <div className={css.rigthComponent}>
                <div className={css.bRight}>
                  {children}
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>
      <div className={css.bg_a} ></div>
    </div>
  )
}

const useStyles = makeStyles({
  
  body : {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    position: 'fixed',
    flexDirection: 'column',
    background: '#0526a0',
    color: '#ffffff',
    fontWeight: 400,
    fontSize: '16px',
    lineHeight: '1.5',
    boxSizing: 'border-box',
    margin: '0',
    padding: '0',
    border: 'none',
    
  },
  bg_a : {
    position: 'fixed',
    top: '0',
    right: '0',
    zIndex: 1,
    width: '40%',
    height: '100%',
    backgroundImage: `url(${pattern})`,
    backgroundRepeat: 'repeat-y',
    backgroundPosition: 'top right',
  },
  section: {
    padding: '2.5rem 0'
  },
  container: {
    margin: '0 auto',
    paddingRight: '1em',
    paddingLeft: '1em',
    maxWidth: '90%'
  },
  row: {
    display: 'flex',
    flex: '0 1 auto',
    flexWrap: 'wrap',
    marginRight: '-1rem',
    marginLeft: '-1rem'
  },
  col_table: {
    flex: '0 0 41.66667%',
    maxWidth: '41.66667%',
    position: 'relative',
    minHeight: '1px',
    paddingRight: '1rem',
    paddingLeft: '1rem',
    transition: '0.3s',
  },
  hdTitle: {
    fontFamily: '"Noto Sans JP", sans-serif',
    lineHeight: 'normal',
    fontweight: 700,
    fontSize: '2.3125rem',
    paddingBottom: '2rem',
  },
  titleTrust: {
    paddingRight: '2.5rem',
  },
  tTitle: {
    paddingBottom: '2rem'
  },
  col: {
    flex: '0 0 50%',
    maxWidth: '50%',
    position: 'relative',
    minheight: 1,
    paddingRight: '1rem',
    paddingLeft: '1rem',
    transition: '0.3s',
  },
  colCard: {
    textAlign: 'center',
  },
  img: {
    height: '2.5rem',
    marginBottom: '2rem'
  },
  rigthComponent: {
    marginLeft: '8.33333%',
    transition: '0.3s',
    flex: '0 0 50%',
    maxWidth: '50%',
    position: 'relative',
    minHeight: 1,
    paddingRight: '1rem',
    paddingLeft: '1rem',
  },
  bRight: {
    borderRadius: '5px',
    minHeight: 300,
    backgroundColor: '#ffffff'
  }

})
