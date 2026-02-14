# RG16 (MBTI-style via Big Five) Design

Date: 2026-02-14

## Goals

- Provide a **question-based** experience that outputs an MBTI-style **16-type** result.
- Keep the scoring model **scientifically grounded**: measure Big Five traits (and aspects), then map to 16-type.
- Free: basic 16-type result.
- Paid (one-time): unlock deeper interpretation including:
  - "type clarity" (高阶/中阶/边界) derived from confidence
  - suffix (e.g. `-A/-T`) with explicit thresholds
  - deeper narrative based on Big Five traits + aspects
- Support multiple paid SKUs later via a generic entitlements system.

## Non-goals (MVP)

- Full clinical-grade psychometrics, norm-referenced percentiles, or validated Chinese licensed scales.
- Account system (user explicitly chose no-login).
- Subscription billing.

## Key Decisions

- **Measurement model**: Big Five + 10 aspects (2 per trait). The UI is Chinese-first.
- **Type output**: MBTI-style mapping from Big Five traits (explainable).
- **Monetization**: Stripe Checkout one-time purchase; modular entitlements keyed by `assessmentId`.
- **Architecture**: Next.js full-stack (App Router) + file store (MVP) + Stripe. (Planned: Postgres/ORM.)

## Questionnaire & Scoring

### Item format

- 5-point Likert: 1..5 (非常不同意..非常同意)
- Mix of forward/reverse keyed items to reduce acquiescence.

### Trait/aspect scoring

- Reverse-keyed item: `score = 6 - answer`
- Aspect score: average of its items, normalized to 0..100.
- Trait score: average of its two aspects (0..100).

### Data quality (not "Cronbach alpha")

Cronbach's alpha is not meaningful from a single respondent. Instead, MVP uses a "response quality" indicator:

- low variance / straight-lining penalty
- completion rate
- (optional later) attention checks / time-per-item

### Mapping to MBTI-style 16-type

We map Big Five trait scores to four dimensions:

- E/I: Extraversion
- N/S: Openness
- F/T: Agreeableness (higher => F)
- J/P: Conscientiousness

For each dimension, compute probability via logistic around 50:

- `p(letter) = sigmoid((score - 50)/scale)`
- Confidence for that letter depends on distance from 50.
- Overall type confidence = min of four dimension confidences.

### "Level" (高阶/中阶/边界)

Derived from overall type confidence:

- 高阶: confidence >= 0.75
- 中阶: 0.60..0.75
- 边界: < 0.60

These thresholds are shown in-report for transparency.

### Suffix (`-A/-T`)

Suffix is computed from Neuroticism (情绪波动/脆弱性) as an explainable derived tag:

- `T` (Turbulent): Neuroticism score > 50
- `A` (Assertive): Neuroticism score <= 50

We also show the underlying Neuroticism score and that this suffix is not part of classic MBTI.

## UX Flow

1. Landing `/`: explain what this is, time estimate, privacy note.
2. Test `/test`: single-page test with progress, autosave, submit.
3. Results `/r/[assessmentId]`:
   - Free: 4-letter type + confidence + brief summary.
   - Paid sections: locked cards + "Unlock deep report" CTA.
4. Payment: redirect to Stripe Checkout.
5. Return to results, server verifies payment, grants entitlements, unlock content.

## Paid SKUs / Entitlements

- SKU config in code (v1):
  - `deep_report_v1`: unlocks modules `deep_report`, `suffix`, `level`, `aspects`
- Entitlements table allows:
  - future add-ons (career, relationship, team, etc.)
  - refunds => revoke entitlement

No-login tradeoff: entitlements bind to `assessmentId`, so sharing the link shares access.

## Data Model (MVP File Store)

- `Assessment`
  - id (uuid)
  - createdAt, updatedAt
  - version (question set version)
  - durationMs
  - answersJson (optional)
  - scoresJson (traits/aspects)
  - mbtiJson (letters/probabilities/confidence)
  - qualityJson
- `Order`
  - stripeCheckoutSessionId, status, amount, currency, itemsJson
  - assessmentId
- `Entitlement`
  - assessmentId
  - sku, module, status

## Stripe Integration

- Create Checkout Session with inline `price_data` (no need to pre-create Products/Prices).
- Store `assessmentId` + `sku` in Stripe metadata.
- Webhook: `checkout.session.completed` grants entitlements.
- Fallback (MVP): a verify endpoint that retrieves the session from Stripe and grants entitlements if paid.

## Security/Privacy

- Do not store PII by default.
- Store assessment results only; raw per-item answers can be optional (off by default later).
- Add basic rate limiting on API routes.

## Future Improvements

- Optional email delivery / magic-link login for cross-device persistence.
- Add a longer "full" questionnaire and facet-level reporting if needed.
- Normative percentiles via collected anonymized dataset (opt-in).
