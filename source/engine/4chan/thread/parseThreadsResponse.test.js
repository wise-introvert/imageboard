import expectToEqual from '../../../utility/expectToEqual'

import Chan from '../../../Chan'
import FourChanConfig from '../../../../chans/4chan/index.json'

import API_RESPONSE from './parseThreadsResponse.test.input.1.json'
import THREADS from './parseThreadsResponse.test.output.1.js'

describe('4chan.org', () => {
	it('should parse threads', () => {
		expectToEqual(
			new Chan(FourChanConfig, {
				messages: {
					comment: {
						deleted: 'Deleted comment',
						hidden: 'Hidden comment',
						external: 'Comment from another thread',
						default: 'Comment'
					}
				}
			}).parseThreads(API_RESPONSE, {
				boardId: 'a'
			}),
			THREADS
		)
	})
})