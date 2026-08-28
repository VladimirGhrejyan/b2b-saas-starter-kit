import {adminConfig} from 'virtual:admin-config'

import {Environment} from './environment'

export const environment = new Environment(adminConfig, import.meta.env)
