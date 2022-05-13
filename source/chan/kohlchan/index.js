import Engine from '../../engine/lynxchan/index.js'
import config from '../../../chans/kohlchan/index.json'
export default (options) => new Engine(config, options)