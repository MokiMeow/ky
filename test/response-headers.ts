import test from 'ava';
import ky from '../source/index.js';

for (const [label, options] of [
	['download progress', {onDownloadProgress: () => undefined}],
	['response size limit', {maxResponseSize: 100}],
	['both response wrappers', {maxResponseSize: 100, onDownloadProgress: () => undefined}],
] as const) {
	test(`${label} keeps mutable response headers independent through clones`, async t => {
		const originalResponse = new Response('payload', {headers: {'x-label': 'original'}});
		const response = await ky('https://example.test', {
			...options,
			fetch: async () => originalResponse,
		});
		const clone = response.clone();
		clone.headers.set('x-label', 'clone');
		t.is(originalResponse.headers.get('x-label'), 'original');
		t.is(response.headers.get('x-label'), 'original');

		const nestedClone = clone.clone();
		t.is(nestedClone.headers.get('x-label'), 'clone');
		nestedClone.headers.set('x-label', 'nested');
		response.headers.set('x-label', 'response');
		t.is(originalResponse.headers.get('x-label'), 'original');
		t.is(response.headers.get('x-label'), 'response');
		t.is(clone.headers.get('x-label'), 'clone');
		t.is(nestedClone.headers.get('x-label'), 'nested');
		t.deepEqual(await Promise.all([response.text(), clone.text(), nestedClone.text()]), ['payload', 'payload', 'payload']);
	});
}
