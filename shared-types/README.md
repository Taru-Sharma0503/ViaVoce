# shared-types

Since `client` and `server` are plain JavaScript (not TypeScript) for hackathon speed, this
package defines shared data shapes as **JSDoc typedefs** rather than `.ts` interfaces. This
gives editor autocomplete and type-hinting in both VS Code's JS language service and any
IDE without adding a TypeScript build step to either service.

## Usage

Import the typedef comment block by reference in any file via JSDoc:

```js
/** @typedef {import('../../shared-types/index.js').CallSession} CallSession */

/** @type {CallSession} */
const call = { roomId: 'abc123', status: 'active', participants: [] };
```

If the project later adopts TypeScript, these typedefs convert almost directly into
`.d.ts` interfaces with minimal changes.

## Contents

- `index.js` — all shared shape definitions: `User`, `CallSession`, `TranslationEvent`,
  and the Socket.IO event payload shapes used by both the client and server.
