import {InitProduct} from './init-product'

try {
  await InitProduct.run()
} catch (error) {
  process.stderr.write(`${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`)
  process.exit(1)
}
