const { TextDecoder, TextEncoder } = require("node:util");
const { ReadableStream, TransformStream, WritableStream } = require("node:stream/web");

Object.assign(globalThis, { TextDecoder, TextEncoder, ReadableStream, TransformStream, WritableStream });
globalThis.BroadcastChannel ??= class BroadcastChannel {
	close() {}
	postMessage() {}
	addEventListener() {}
	removeEventListener() {}
};
const { fetch, Headers, Request, Response } = require("undici");
Object.assign(globalThis, { fetch, Headers, Request, Response });
