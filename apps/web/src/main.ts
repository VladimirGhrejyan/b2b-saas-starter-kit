import {createRoot} from 'react-dom/client'

import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'
import {createWebPorts} from '@b2b-saas-starter-kit/frontend-core'

import {createProductApp} from '@/app/create-product-app'

async function bootstrap(): Promise<void> {
  const element = await createProductApp({
    ports: createWebPorts(),
    history: 'browser',
  })
  const rootElement = document.getElementById('root')

  if (TypeScriptUtils.isNil(rootElement)) {
    throw new Error('Root element #root not found')
  }

  createRoot(rootElement).render(element)
}

void bootstrap()
