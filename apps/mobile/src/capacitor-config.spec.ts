import {mobileWebDir} from '../capacitor.config'

describe('mobile Capacitor config', () => {
  it('points webDir at the web app dist', () => {
    expect(mobileWebDir).toBe('../web/dist')
  })
})
