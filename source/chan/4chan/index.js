import Engine from '../../engine/4chan/index.js'
import config from '../../../chans/4chan/index.json'
export default (options) => new Engine(config, options)