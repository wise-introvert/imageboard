import Engine from '../../engine/lynxchan'
import config from '../../../chans/endchan/index.json'
export default (options) => new Engine(config, options)