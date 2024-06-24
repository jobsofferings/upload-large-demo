import React from 'react'
import { Switch, BrowserRouter, Route } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import antdConfig from 'src/config/antdConfig'
import UploadLarge from './pages/UploadLarge'
import './App.less'

export type useSitevarItemProps = string | useSitevarItemProps[]

export type useSitevarProps = useSitevarItemProps[]

const App = () => {
  return (
    <ConfigProvider {...antdConfig}>
      <BrowserRouter basename={'/'}>
        <Switch>
          <Route path="/large">
            <UploadLarge />
          </Route>
        </Switch>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
