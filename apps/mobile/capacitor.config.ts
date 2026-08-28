import type {CapacitorConfig} from '@capacitor/cli'

export const mobileWebDir = '../web/dist'

const config: CapacitorConfig = {
  appId: 'com.b2bsaasstarterkit.app',
  appName: 'B2B SaaS Starter',
  webDir: mobileWebDir,
}

export default config
