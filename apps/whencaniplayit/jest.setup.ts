import '@testing-library/jest-dom'

class TestRequest implements Request {
	readonly method: string
	readonly headers: Headers
	readonly redirect: RequestRedirect
	readonly signal: AbortSignal | null
	readonly credentials: RequestCredentials
	readonly cache: RequestCache
	readonly mode: RequestMode
	readonly referrer: string
	readonly integrity: string
	readonly keepalive: boolean
	readonly destination: RequestDestination
	readonly referrerPolicy: ReferrerPolicy

	constructor(input: RequestInfo, init?: RequestInit) {
		this.method = init?.method ?? 'GET'
		this.headers = new Headers(init?.headers as HeadersInit)
		this.redirect = 'follow'
		this.signal = init?.signal ?? null
		this.credentials = init?.credentials ?? 'same-origin'
		this.cache = init?.cache ?? 'default'
		this.mode = init?.mode ?? 'cors'
		this.referrer = init?.referrer ?? 'client'
		this.integrity = init?.integrity ?? ''
		this.keepalive = init?.keepalive ?? false
		this.destination = init?.destination ?? ''
		this.referrerPolicy = init?.referrerPolicy ?? 'no-referrer'
	}

	readonly body: ReadableStream<Uint8Array> | null = null
	readonly bodyUsed = false

	arrayBuffer(): Promise<ArrayBuffer> {
		throw new Error('Not implemented')
	}
	blob(): Promise<Blob> {
		throw new Error('Not implemented')
	}
	formData(): Promise<FormData> {
		throw new Error('Not implemented')
	}
	json(): Promise<any> {
		throw new Error('Not implemented')
	}
	text(): Promise<string> {
		throw new Error('Not implemented')
	}
}

class TestResponse implements Response {
	readonly body: ReadableStream<Uint8Array> | null = null
	readonly bodyUsed = false
	readonly headers: Headers
	readonly ok: boolean
	readonly redirected = false
	readonly statusText: string
	readonly trailer: Promise<Headers>
	readonly type: ResponseType
	readonly url = ''
	readonly status: number

	constructor(body: BodyInit | null = null, init: ResponseInit = {}) {
		this.status = init.status ?? 200
		this.ok = this.status >= 200 && this.status < 300
		this.statusText = init.statusText ?? ''
		this.headers = new Headers(init.headers)
		this.trailer = Promise.resolve(new Headers())
		this.type = init.type ?? 'default'
		this._body = typeof body === 'string' ? body : null
	}

	private _body: string | null = null

	async arrayBuffer(): Promise<ArrayBuffer> {
		return new TextEncoder().encode(this._body ?? '').buffer
	}
	async blob(): Promise<Blob> {
		throw new Error('Not implemented')
	}
	async formData(): Promise<FormData> {
		throw new Error('Not implemented')
	}
	async json(): Promise<any> {
		return this._body ? JSON.parse(this._body) : {}
	}
	async text(): Promise<string> {
		return this._body ?? ''
	}
	clone(): Response {
		return new TestResponse(this._body, { status: this.status, headers: this.headers })
	}
}

class TestHeaders implements Headers {
	private values = new Map<string, string>()

	constructor(initial?: HeadersInit) {
		if (initial instanceof Headers) {
			initial.forEach((value, key) => this.values.set(key, value))
		} else if (Array.isArray(initial)) {
			initial.forEach(([key, value]) => this.values.set(key, value))
		} else if (initial) {
			Object.entries(initial).forEach(([key, value]) => this.values.set(key, String(value)))
		}
	}

	append(name: string, value: string): void {
		this.values.set(name.toLowerCase(), value)
	}
	delete(name: string): void {
		this.values.delete(name.toLowerCase())
	}
	forEach<T>(callback: (value: string, key: string, headers: Headers) => void): void {
		this.values.forEach((value, key) => callback(value, key, this))
	}
	get(name: string): string | null {
		return this.values.get(name.toLowerCase()) ?? null
	}
	has(name: string): boolean {
		return this.values.has(name.toLowerCase())
	}
	set(name: string, value: string): void {
		this.values.set(name.toLowerCase(), value)
	}
	entries(): IterableIterator<[string, string]> {
		return this.values.entries()
	}
	keys(): IterableIterator<string> {
		return this.values.keys()
	}
	values(): IterableIterator<string> {
		return this.values.values()
	}
	[Symbol.iterator](): IterableIterator<[string, string]> {
		return this.entries()
	}
}

globalThis.Request = globalThis.Request ?? (TestRequest as typeof Request)
globalThis.Response = globalThis.Response ?? (TestResponse as typeof Response)
globalThis.Headers = globalThis.Headers ?? (TestHeaders as typeof Headers)
