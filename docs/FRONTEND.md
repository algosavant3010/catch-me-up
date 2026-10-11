# Frontend Audit and Design System

## Scope

The existing Next.js App Router, React state, Tailwind v4, match engine,
API payloads, persistence keys, prediction scoring, and AI integration are
retained. No real features are replaced with mock data. Lucide React is the
only added dependency, providing consistent interface icons.

## Audit and Changes

| Surface                 | Finding                                                          | Change                                                                                                               |
| ----------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Landing `/`             | Generic gradient, floating feature cards, weak sporting identity | Local cricket photography, condensed display type, unframed editorial sections, both original demo links retained    |
| Match `/match/[id]`     | Desktop constrained to a phone-sized column                      | Responsive 78rem shell, two-column score/momentum layout, full-width feature grid                                    |
| Scoreboard              | Score competed with secondary metrics; excessive nested surfaces | Large tabular score, clear target, separated run-rate metrics and batter rows                                        |
| Momentum/playback       | Unlabelled chart; small rounded playback controls                | Chart heading, axis endpoints and wicket legend; icon playback controls with accessible names and titles             |
| Chat/predictions        | Inconsistent headings, spacing, and empty states                 | Shared feature sections, stable empty state, consistent outcome controls and statistics                              |
| Friends room            | Placeholder-only fields, weak error/pending feedback             | Persistent labels, flexible code field, pending actions, recoverable network errors, aligned leaderboard             |
| Photo sync              | Small upload affordance and sparse status feedback               | Full-width upload target, format/size information, processing indicator, announced results                           |
| Settings/calibration    | Dense language pills, inconsistent grouping                      | Language grid, segmented modes/themes, separated preferences, labelled checkbox rows                                 |
| Question sheet          | Missing input label, unhandled request failure                   | Labelled composer, suggested-question actions, pending state and recoverable errors; question retained after failure |
| Recap/proof/audio/share | Inconsistent cards and controls                                  | Stream skeleton, editorial recap lines, reference controls, aligned proof details and icon actions                   |
| Shared sheet            | Focus could escape; nested Escape closed both dialogs            | Focus containment, topmost keyboard handling, nested scroll locking, restored opener focus, sticky header            |
| Notifications           | Historical events could fill the screen on late join             | At most two visible toast items; notification generation and preferences unchanged                                   |
| PWA/share image         | Old purple identity                                              | Matching neutral/red manifest, icon, and server-generated share card                                                 |

## Tokens and Conventions

- Semantic colors live in `app/globals.css`, with complete light-theme overrides.
- Background, surface, text, border, action, success, warning, and danger have distinct tokens.
- Barlow is the body family; Barlow Condensed is reserved for the score and landing title.
- Noto language fonts remain available but are not all preloaded on the English landing page.
- Use the existing Tailwind 4px spacing scale. Radii are 4px, 6px, and 8px.
- Reuse `page-shell`, `feature-panel`, `section-heading`, `field-label`,
  `setting-row`, `button-primary`, `button-secondary`, and `icon-button`.
- Inputs and primary controls have a 44px minimum target; metric text uses tabular numerals.
- The desktop score layout starts at 1024px; feature columns start at 640px.
- Animation uses a 160ms interaction token and a 180ms sheet entrance.
  Reduced-motion settings override both. Theme backgrounds do not interpolate,
  preventing temporary light-text/dark-background mismatches during hydration.
- No fixed-size form fields, viewport-scaled type, negative tracking, or page-section card nesting.

## Verification

- Existing unit/evaluation coverage is retained. New hermetic tests cover dialog
  navigation, nested Escape, form pending states, server/network errors,
  create/join success, and unchanged request payloads.
- Focused coverage for `Sheet`, `SamjhaoSheet`, and `RoomPanel`: 99.13% lines,
  96.32% statements, 82.43% branches. This is scoped coverage, not a claim
  that the entire repository meets 80% coverage.
- Playwright covers both page routes at 320, 390, 768, and 1440px, light/dark
  dialog axe scans, keyboard focus restoration, plus the existing fan flows.
- Production build, typecheck, ESLint, and runtime dependency audit are checked.
- Browser screenshots are reviewed for the landing page, score layout, and
  scrolling mobile preferences. Automated checks do not replace native-speaker
  review or testing with every assistive technology.

## Image Source

`public/cricket-ground.jpg` is a locally hosted cricket-ball photograph from
Unsplash: https://images.unsplash.com/photo-1531415074968-036ba1b575da
([Unsplash license](https://unsplash.com/license)). It is rendered with Next Image
using reserved dimensions, responsive sizing, and priority loading on the landing
page. It depicts cricket equipment, not the fictional teams or a live match.
