You are working on the VaultSync frontend, a secure secret-management platform for developers and teams.

Your task is to design or update frontend pages while strictly maintaining the existing VaultSync visual language. Do not introduce a new theme, unrelated colors, generic SaaS styling, or inconsistent components.

DESIGN DIRECTION

VaultSync should feel:

- Secure
- Technical
- Calm
- Premium
- Developer-focused
- Editorial rather than corporate
- Thoughtful and trustworthy

The design should look like a serious security product built for engineers.

COLOR SYSTEM

Use these CSS variables consistently:

--background: #f5f7f3;
--foreground: #12201b;
--ink: #12201b;
--muted: #66726b;
--line: #d6ddd6;
--accent: #d8f36b;
--orange: #ef795a;

Color usage:

- Deep forest green #12201b:
  Main headings, dark panels, navigation, dashboard sidebar, terminal areas, and primary dark surfaces.

- Off-white #f5f7f3:
  Main page background and calm content areas.

- White #ffffff:
  Forms, dashboard panels, and focused content containers.

- Sage green:
  Soft section backgrounds, comparison tables, success states, and supporting surfaces.

- Lime #d8f36b:
  Primary CTAs, secure indicators, success highlights, progress bars, and active security states.

- Coral orange #ef795a:
  Eyebrows, emphasis text, icons, arrows, warnings, active accents, and important highlights.

- Muted green-gray #66726b:
  Secondary text, descriptions, metadata, helper text, and inactive navigation.

Avoid purple, blue-heavy palettes, neon gradients, excessive black, glassmorphism, and large decorative blobs.

TYPOGRAPHY

Use the existing Geist font setup:

- Geist Sans for normal UI text, headings, labels, and descriptions.
- Geist Mono for code snippets, API labels, technical metadata, environment names, timestamps, and system statuses.

Typography principles:

- Use large, expressive headings with tight line height.
- Use negative letter spacing only for large display headings where appropriate.
- Use coral emphasis with italic text for important second lines.
- Use uppercase eyebrow labels with small font size and generous letter spacing.
- Keep body text readable, muted, and highly scannable.
- Do not use oversized text inside compact cards.
- Do not introduce random fonts.

COMMON COMPONENT STYLE

Use:

- Thin 1px borders using --line.
- Small or no border radius.
- Sharp editorial rectangular panels.
- Structured grids.
- Generous whitespace.
- Subtle shadows using pale sage tones.
- Small orange arrows such as → or ↗ for actions.
- Lime buttons with dark forest text.
- Dark forest panels for terminals, vault previews, and technical visualizations.
- Monospace labels for system information.

Avoid:

- Excessive rounded cards.
- Nested cards.
- Heavy gradients.
- Purple or blue default buttons.
- Generic dashboard templates.
- Floating glass panels.
- Unnecessary decorative illustrations.
- Large empty hero sections.
- Inconsistent border radii.
- Random icon styles.

BUTTONS

Primary button:

- Background: --accent
- Text: --ink
- Strong font weight
- Compact rectangular shape
- Include a directional icon such as ↗ or →

Secondary button:

- Transparent or white background
- Thin --line border
- Dark text
- Include a directional icon when appropriate

Dark button:

- Background: --ink
- White text
- Use for navigation or secondary high-contrast actions

Buttons should have:

- Clear hover state
- Small upward movement on hover
- Disabled opacity
- Visible focus state
- Stable dimensions
- No text overflow on mobile

AUTHENTICATION PAGES

Login, signup, forgot-password, reset-password, and verify-OTP pages must share the same auth layout:

- Off-white full-page background
- VaultSync brand at the top
- Two-column desktop layout
- Editorial explanatory panel on the left
- White bordered form card on the right
- Soft sage offset shadow behind the form card
- Coral section eyebrow
- Large dark heading with coral emphasized line
- Lime primary submit button
- Muted helper text
- Inline error messages in muted red
- Inline success messages using pale green background and dark green text
- Responsive single-column layout on mobile
- Inputs must always remain inside the white card
- Inputs should use width: 100% and min-width: 0
- Use clear field labels above inputs
- Keep form functionality, API calls, validation, loading state, and redirects unchanged

DASHBOARD PAGES

Dashboard pages should use the same VaultSync visual system:

- Forest green sidebar
- Off-white or pale sage main background
- White bordered panels
- Coral section labels
- Lime secure-status indicators
- Monospace environment names and technical metadata
- Structured statistics
- Vault environment rows
- Audit activity lists
- Security score or status panels
- Clear refresh and logout actions
- Responsive sidebar collapse on mobile

LANDING PAGE CONSISTENCY

The landing page uses:

- Forest green primary sections
- Off-white content sections
- Sage comparison and workflow sections
- Coral emphasis headings
- Lime CTAs and security markers
- Dark terminal and vault mockups
- Thin borders and structured editorial grids
- Developer-focused technical language

Any new page should look like it belongs to the same product as the landing page.

RESPONSIVE DESIGN

The interface must work well at:

- Desktop
- Tablet
- Mobile

On mobile:

- Collapse multi-column layouts into one column.
- Keep form inputs inside their containers.
- Prevent horizontal overflow.
- Stack buttons where necessary.
- Make dashboard sidebars collapse cleanly.
- Preserve comfortable spacing and readable text.
- Never allow headings, buttons, or cards to overlap.

ACCESSIBILITY

- Use semantic HTML.
- Use labels for every form input.
- Use buttons for actions and links for navigation.
- Add aria-labels where icons are not self-explanatory.
- Maintain accessible color contrast.
- Provide visible keyboard focus states.
- Use role="status" for successful async messages.
- Do not rely on color alone to communicate status.

IMPLEMENTATION RULES

Before editing:

1. Inspect the existing page, shared styles, components, and API behavior.
2. Reuse existing CSS classes and patterns where possible.
3. Preserve all existing functionality.
4. Avoid unnecessary dependencies.
5. Avoid unrelated refactoring.
6. Match the current VaultSync theme before adding new styles.

After editing:

1. Run TypeScript validation.
2. Run focused ESLint on changed files.
3. Check for responsive overflow.
4. Confirm loading, error, success, submit, navigation, and authentication states.
5. Report any existing unrelated warnings separately.

Always prioritize design consistency over inventing new visual patterns.
