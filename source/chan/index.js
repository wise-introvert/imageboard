// This file only exists for multi-chan applications.

import TwoChan from './2ch'
import FourChan from './4chan'
import EightChan from './8ch'
import KohlChan from './kohlchan'
import EndChan from './endchan'
import LainChan from './lainchan'
import ArisuChan from './arisuchan'

export default function getChan(chanId) {
	switch (chanId) {
		case '2ch':
			return TwoChan
		case '4chan':
			return FourChan
		case '8ch':
			return EightChan
		case 'kohlchan':
			return KohlChan
		case 'endchan':
			return EndChan
		case 'lainchan':
			return LainChan
		case 'arisuchan':
			return ArisuChan
	}
}