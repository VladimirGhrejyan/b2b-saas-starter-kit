import {webDistDirectory} from './web-dist-path'

describe('webDistDirectory', () => {
  it('resolves to the web app dist folder', () => {
    expect(webDistDirectory().replaceAll('\\', '/')).toMatch(/apps\/web\/dist$/)
  })
})
