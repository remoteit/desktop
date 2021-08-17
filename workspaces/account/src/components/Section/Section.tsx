import { Box, makeStyles, Typography } from '@material-ui/core'
import React from 'react'

export const Section = ({
    title,
    children,
    center
  }: {
    title: string | React.ReactNode
    children: React.ReactNode
    center?: boolean
  }): JSX.Element => {

    const css = useStyles()
    return (
      <section
        style={{ maxWidth: '100%' , color: '#333333'}}
      >
        
        <div className="txt-md w-100">
          <Box textAlign={center ? 'center' : ''}>
            <Typography variant="h4" gutterBottom className={ center ? css.title : ''}>
              {title}
            </Typography>
          </Box>
          {children}
        </div>
      </section>
    )
  }

const useStyles = makeStyles({
  title: {
    fontWeight: 700,
    fontSize: 28
  }
})