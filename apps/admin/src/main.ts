import {createRoot} from 'react-dom/client'

import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'
import {createWebPorts} from '@b2b-saas-starter-kit/frontend-core'

import {createAdminApp} from '@/app/create-admin-app'
import {environment} from '@/shared/environment'

async function bootstrap(): Promise<void> {
  const ports = createWebPorts({nodeEnv: environment.nodeEnv})
  const element = await createAdminApp({
    ports,
    history: 'browser',
  })
  const rootElement = document.getElementById('root')

  if (TypeScriptUtils.isNil(rootElement)) {
    throw new Error('Root element #root not found')
  }

  createRoot(rootElement).render(element)
  ports.logger.debug('App rendered')
}

void bootstrap()
