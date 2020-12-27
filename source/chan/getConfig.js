// This file only exists for multi-chan applications
// that use `getConfig()` exported function.
//
// For example, `captchan` application imports `getConfig()`
// directly from "imageboard/commonjs/chan/getConfig".

import TwoChan from '../../chans/2ch/index.json'
import FourChan from '../../chans/4chan/index.json'
import EightChan from '../../chans/8ch/index.json'
import KohlChan from '../../chans/kohlchan/index.json'
import EndChan from '../../chans/endchan/index.json'
import LainChan from '../../chans/lainchan/index.json'
import ArisuChan from '../../chans/arisuchan/index.json'

// A list of all supported chans.
const CHANS = [
	TwoChan,
	FourChan,
	EightChan,
	KohlChan,
	EndChan,
	LainChan,
	ArisuChan
]

// An index of all supported chans by their id (or alias).
const CHANS_INDEX = CHANS.reduce((index, chan) => {
	index[chan.id] = chan
	if (chan.aliases) {
		for (const alias of chan.aliases) {
			index[alias] = chan
		}
	}
	return index
}, {})

export default function getConfig(id) {
	return CHANS_INDEX[id]
}