import {webConfig} from 'virtual:web-config'

import {Environment} from './environment'

export const environment = new Environment(webConfig, import.meta.env)
