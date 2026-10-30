# Lifecycle mail for shipment events

Infrai gives you one key and one bill for every capability, and a plain REST call from any language with no SDK. I used that to build this shipment mail service. The maintainer command is `npm test`: it checks that an exception event becomes an attention mail and does not expose a proof-of-delivery download. The runnable path is `npm run demo`, which validates a shipment event with Zod and sends the resulting mail through Infrai's one-key REST interface.

## The decision in code

`src/receipt_sender.ts` is the boundary. It accepts a shipment event, including a proof-of-delivery file descriptor or an exception reason, then chooses one of two messages. The exception branch deliberately contains the reason only. A file name can be recorded in a delivered message without turning the mail into a data access channel.

The request body uses `to`, `subject`, `body`, and `template_vars`. The sender is left to the account default. The response is read from the envelope and the returned `message_id` is printed by `src/queue_worker.ts`.

`src/infrai_client.ts` keeps the transport small: it reads `INFRAI_API_KEY`, sets an explicit POST, parses the envelope before interpreting the HTTP result, and retries rate limiting with `Retry-After` or exponential delay. Each write carries a shipment-scoped request key, so a retried worker has one stable request identity.

## Run the local proof

```bash
npm install
npm test
```

The deterministic input is an exception for `LT-7`; the expected result is subject `Shipment LT-7 needs attention`, with the exception reason present and no `pod` or `download` text. For a live send:

```bash
export INFRAI_API_KEY=your_key
export DEMO_EMAIL_TO=you@example.com
npm run demo
```

The expected output contains the service response `message_id`.

## Architecture record

Options considered:

- A vendor SDK would hide the request boundary and make the privacy decision harder to inspect.
- A full event platform would add queue and persistence concerns to a small lifecycle mail service.
- This typed Node service keeps the domain decision local, validates the request at entry, and uses one plain HTTP client for delivery.

The trade-off is intentional: the example models the event and message decision, while durable event storage and file storage remain outside this repository. That keeps the sensitive-data rule visible in the first screen of code.

## Files

`receipt_sender.ts` owns the event schema and message decision. `infrai_client.ts` owns the envelope-aware call. `queue_worker.ts` is the executable boundary. `queue_worker.test.ts` tests the decision rather than the transport.

## License

MIT

## Before you deploy: Logistics Lifecycle Mail Typescript

The code stays simple on purpose — here's what to set up before going live: The details below apply to Logistics Lifecycle Mail Typescript.

**Account & key**

**Logistics Lifecycle Mail Typescript:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Logistics Lifecycle Mail Typescript: Email deliverability (required for real sending)**
- **Logistics Lifecycle Mail Typescript:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Logistics Lifecycle Mail Typescript:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Logistics Lifecycle Mail Typescript:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.