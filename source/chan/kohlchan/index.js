import Engine from '../../engine/lynxchan'
import config from '../../../chans/kohlchan/index.json'
export default (options) => new Engine(config, options)