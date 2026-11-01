# Architecture

## Client

`main.jsx` mounts the render error boundary, router and `CaseProvider`. Pages own transient UI input: premise, selected difficulty, open evidence, and accusation confirmation. `features/cases/state` owns shared case snapshots, results, loading states, mutation locks and request errors.

```text
Page → store action → caseApi → httpClient → Express
             ↓                       ↓
          reducer               session token header
             ↓
        subscribed pages
```

State is keyed by case ID. Request IDs discard stale read completions. Route cleanup aborts reads. Starting a mutation invalidates older pending case reads. A synchronous per-case lock prevents double submissions before React has rendered its disabled button. The reducer applies server-returned progress and hint counts; it never calculates a score. Completion discards the investigation snapshot and stores the returned result separately.

Failed network mutations trigger a read to reconcile possibly committed progress. They are never automatically resubmitted: repeating a hint could consume the next hint. A full refresh reloads from MongoDB using the token retained in the same browser tab. The memory store is a UI cache, not a persistence or authorization boundary.

`services/sessionStorage.js` owns token reads/writes and storage-unavailable errors. Creation checks storage before calling the API. Tokens are excluded from reducer state, URLs and logs. `httpClient.js` attaches case authorization and normalizes network, timeout, cancellation and API-envelope errors.

## Server

```text
request context → security headers/CORS → JSON parser → limits
→ routes → authenticateCase → controller → service → repository → MongoDB
                                   ↓
                             response serializer
errors from any async handler → centralized error middleware
```

- **Routes** register endpoints and middleware in order.
- **Controllers** validate incoming bodies with Zod and send HTTP responses. Express 5 forwards rejected async handlers to error middleware.
- **Case service** enforces gameplay transitions, sequential hints, idempotent discovery, one final accusation, and scoring.
- **Repository** performs expiring-case reads and optimistic conditional writes. The filter includes case ID, active status, revision and expiry. A concurrent winner increments revision; losers reload and reevaluate the rule. Retry attempts are bounded.
- **Serializers** explicitly allowlist fields. Active responses omit solutions, relevance and unrevealed hints. Completed case reads contain metadata only; the authenticated result endpoint exposes the final solution.
- **Model** persists case data with secret fields excluded by default and an expiry TTL index. Every read also checks expiry, because TTL deletion is asynchronous.

Only accusation and result operations load the secret solution. Authentication separately loads the token hash and compares it safely. Discovery and hint mutations do not need solution access.

## AI generation

`caseGeneratorService.js` calls the injected Groq client and validates its untrusted JSON against the generation schema and invariants. The total deadline is at most 45 seconds and attempts are capped at three. SDK retries are disabled. Provider errors are replaced with safe 502/503 errors. No case is persisted unless generation validates, and there is no static production fallback.

Structural validation and explicit answer-leakage detection cannot prove that a narrative is logically sound. No second critique pass or perfect coherence guarantee is claimed. Text evidence is sufficient; all artifacts remain fictional.

`shared/gameRules.js` contains public difficulty counts and base scores. Both applications import it so their counts stay consistent. Shared files must never contain secrets or generated solutions.
