export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // In Node.js 22+, a global localStorage object might be defined but lack methods like getItem.
        // This causes crashes when third-party libraries check for its existence and subsequently call getItem.
        // Polyfill the missing methods here.
        if (typeof globalThis.localStorage !== 'undefined' && !globalThis.localStorage.getItem) {
            Object.defineProperty(globalThis, 'localStorage', {
                value: {
                    getItem: () => null,
                    setItem: () => { },
                    removeItem: () => { },
                    clear: () => { },
                    key: () => null,
                    length: 0,
                },
                writable: true,
                configurable: true,
            });
        }
    }
}
