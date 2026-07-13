/**
 * Shared data shape definitions for ViaVoce.
 * Consumed via JSDoc @typedef imports by both client and server.
 * These mirror the MongoDB schemas defined in the architecture blueprint
 * and the Socket.IO event contracts - keep this file as the single
 * source of truth when either side changes a shape.
 */

/**
 * @typedef {'hearing' | 'deaf' | 'both'} UserRole
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {UserRole} role
 * @property {string} [preferredLanguage]
 * @property {string} [preferredSignSet]
 */

/**
 * @typedef {'active' | 'ended'} CallStatus
 */

/**
 * @typedef {Object} CallParticipant
 * @property {string} userId
 * @property {UserRole} role
 * @property {string} joinedAt
 * @property {string} [leftAt]
 */

/**
 * @typedef {Object} CallSession
 * @property {string} id
 * @property {string} roomId
 * @property {CallParticipant[]} participants
 * @property {CallStatus} status
 * @property {string} startedAt
 * @property {string} [endedAt]
 * @property {string} createdBy
 */

/**
 * @typedef {'speech-to-text' | 'sign-to-speech'} TranslationDirection
 */

/**
 * @typedef {Object} TranslationEvent
 * @property {string} callId
 * @property {string} userId
 * @property {TranslationDirection} direction
 * @property {string} outputText
 * @property {number} [confidence]
 * @property {string} timestamp
 */

/**
 * Socket.IO event payload shapes.
 */

/** @typedef {Object} CaptionNewPayload
 * @property {string} text
 * @property {string} speakerId
 * @property {string} timestamp
 */

/** @typedef {Object} TranslationNewPayload
 * @property {string} text
 * @property {string} [audioUrl]
 * @property {string[]} [glossSequence]
 * @property {string} speakerId
 */

/** @typedef {'listening' | 'processing' | 'idle' | 'detecting' | 'generating'} AIStatusState */

export {}; // marks this file as an ES module; typedefs are consumed via JSDoc imports only
