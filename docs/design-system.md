# Document Builder Design System

## Overall Visual Direction

The interface should feel like a polished SaaS workflow: calm, precise, spacious, and fast to scan. The active document task should remain the first visual priority. Generic UI components in `src/components/ui/` are the default building blocks for page headers, form fields, uploads, and actions.

## Color Rules

- Use slate as the neutral base for text, borders, and page backgrounds.
- Use blue for primary actions, focus states, icon surfaces, and workflow emphasis.
- Use emerald only for success and ready states.
- Use rose only for destructive actions and validation errors.
- Use `bg-slate-50` for page chrome, `bg-white` for section cards, and `bg-slate-50/80` for inset status panels.
- A subtle top page wash may use `bg-linear-to-b from-blue-50/70 to-transparent` when the page needs more depth.
- Avoid adding new dominant palettes unless the page introduces a real semantic status.

## Typography Rules

- Use the global Geist sans font from `app/layout.tsx`.
- Page titles use `text-3xl` to `text-4xl`, semibold, slate-950.
- Section titles stay compact: `text-base font-semibold`.
- Helper text uses `text-sm` with comfortable line height.
- Do not scale type by viewport width.

## Spacing Rules

- Page shells use `px-4 py-8`, then `sm:px-6 lg:px-8`.
- Main workflow content should feel full on desktop and be constrained around `max-w-7xl`.
- Two-column workflow pages should use a persistent side panel around `340px` to `360px` and leave the remaining width to the content form.
- Prefer named shell/grid rules such as `.app-shell` and `.document-workspace-grid` when arbitrary grid utilities become hard to read or unreliable in dev tooling.
- Section cards use `p-6`, then `sm:p-7 lg:p-8`.
- Field grids use `gap-5`.
- Section metadata and controls use `gap-7`.
- Major stacked sections use `space-y-7` or wider so each task phase reads separately.

## Border Radius Rules

- Primary workflow sections use `rounded-2xl`.
- Inputs, selects, and buttons use `rounded-xl`.
- Icon surfaces use `rounded-2xl`.
- Avoid fully pill-shaped controls except for small status badges.

## Shadow And Elevation Rules

- Section cards use a soft border and medium shadow: `border border-slate-200/80 bg-white shadow-md shadow-slate-950/5`.
- Template panels and form sections share the same `rounded-2xl`, border, padding, and shadow scale.
- Selectable cards use `shadow-sm` by default, then `hover:shadow-md` and a tiny upward hover motion.
- Primary buttons can use stronger blue shadows, especially for the final generation CTA.
- Inputs use `shadow-sm shadow-slate-950/5`.
- Do not stack decorative cards inside other decorative cards.

## Iconography

Icons are part of the product language, not decoration. Use Lucide icons to improve recognition, scanning, and action clarity.

- Use `lucide-react` for all interface icons.
- Use 16px icons for inline badges, errors, and compact status text.
- Use 18-20px icons inside inputs and buttons.
- Use 24px icons for page and section headers.
- Icons should be semantic: `FileText` for documents, `Download` for generation, `UploadCloud` for uploads, `PenLine` for signature, `Stamp` for stamp, `AlertCircle` for errors, and `CheckCircle` for success.
- Hide non-interactive icons from assistive tech with `aria-hidden="true"`.
- Icon-only buttons must have an `aria-label`.

## Component Patterns With Icons

Buttons:

- Use `leftIcon` for the primary action cue, such as `Download` on "Generate DOCX".
- Use `rightIcon` only when it clarifies forward motion or a menu affordance.
- Loading state replaces the left icon with the spinner to preserve alignment.

Inputs:

- Use `leadingIcon` when the icon helps identify the field category.
- Keep input icons at 20px and slate-400.
- Do not use icons as a replacement for labels.

Section headers:

- Every major form section should use `SectionHeader`.
- Use a 24px semantic icon on a blue-tinted surface.
- Pair every section icon with a title and a short practical description.

Uploads:

- Use `ImageUpload` for image fields.
- Empty state uses `UploadCloud`.
- Preview state uses `ImageIcon` and `CheckCircle`.
- Removal uses `X` through a labeled `Button`.

## Visual Hierarchy

Icons should make the page easier to scan from top to bottom:

- Page header icon identifies the workflow.
- Section icons mark the task phase.
- Input icons distinguish similar text fields.
- Status icons make errors and success states recognizable before reading the full message.
- Section titles use stronger contrast and `font-semibold`; descriptions use `text-slate-500`.
- The final CTA section should have the highest action emphasis on the page.

Combine icon and text when the action or state is important. Avoid icons on low-value copy where they would add noise.

## Form Component Rules

- Use `TextInput`, `Textarea`, `Dropdown`, and `ImageUpload` instead of raw controls.
- Labels must be visible and connected to controls with `htmlFor`.
- Helper text and errors belong directly below the field.
- Required fields show a rose asterisk.
- Error states include rose border, rose focus ring, and an `AlertCircle` message.
- Use `noValidate` when custom validation drives the displayed errors.

## Button Rules

- Use `Button` for all clickable actions.
- `primary` is for the main page action and uses the blue-to-indigo gradient.
- `secondary` is for alternate actions.
- `ghost` is for quiet inline actions like upload removal.
- `danger` is only for destructive actions.
- Use loading state during async work and keep the button disabled while loading.
- Keep hover and press feedback subtle: scale at `1.01` on hover and `0.99` on active.
- The generate action uses a larger button (`min-h-12`, wider horizontal padding, stronger shadow) than routine controls.

## Image Upload Rules

- Accept PNG, JPG, and JPEG only.
- Use a dashed dropzone with "Click or drag to upload".
- Show a preview thumbnail, file name, and file size after selection.
- Provide a remove action when a file is selected.
- Keep helper text focused on constraints such as file type and max size.
- Dropzones use a subtle white or blue-tinted background, dashed border, and hover elevation.
- Preview states use an inner white preview card with a soft border and shadow.

## Template Selection Panel Pattern

Use the template selection panel when a user can generate one or more outputs from the same form data.

- Place the panel to the left of the form on desktop.
- Keep it above the form on mobile.
- Use `lg:sticky` when the form is long so selected templates remain visible.
- Show selected count, available count, "Select all", and "Clear" controls.
- Keep the selected count prominent and make "Select all" and "Clear" proper `Button` controls.
- Keep the panel visually calm: one card container, one tinted status area, and a list of selectable cards.
- The template panel should be visually distinct from form content, but use the same card radius, border, and elevation scale.

## Selectable Card Pattern

Use selectable cards instead of default checkboxes when each choice benefits from a name, description, file type, and status.

- The whole card should toggle selection.
- Use `aria-pressed` for button-based selectable cards.
- Use `FileText` for document template cards.
- Show a `.docx` badge and the output file name.
- Selected cards use blue border, light blue background tint, and a check indicator.
- Do not hide the selected state behind color alone.
- Selected cards may use stronger border, ring, and shadow than unselected cards.

## Multi-Select UX Rules

- At least one item must be selected before generation.
- "Select all" and "Clear" should be available when there are three or more likely choices.
- Preserve the user's selected order when possible.
- Use counts in action labels: "Generate Document" for one and "Generate 3 Documents" for many.
- Keep validation messages close to the selection panel and summarize again in the form status.

## Selected State Rules

- Use `border-blue-400`, `bg-blue-50`, and a visible `CheckCircle` indicator.
- Keep unselected cards white with slate borders.
- Do not use default checkboxes as the primary visual control.
- Disabled cards should keep shape and content visible with reduced opacity.

## Page Layout Rules

- Start workflow pages with `PageHeader`.
- Use the eyebrow only when it adds useful product context; avoid low-value labels above the page title.
- Put a semantic icon next to the title, and align the subtitle with the title text rather than floating it under the icon.
- Keep subtitles practical and concise.
- Use the actions slot for status badges or page-level commands.
- Place the primary workflow sections directly under the header.
- Use responsive side panels for workflow controls that affect the entire form.
- Ensure mobile layouts stack cleanly before desktop grids are introduced.

## Background Rules

- Use `bg-slate-50` for workflow pages so white cards can float clearly.
- Add only subtle decorative gradients, usually a top wash that fades to transparent.
- Decorative backgrounds should sit behind the content with `absolute` positioning and must not reduce text contrast.
- Avoid flashy gradients, patterned backgrounds, or large decorative shapes on operational tools.

## Panel Vs Content Layout Rules

- Left panels contain workflow-wide controls, selection state, and compact summaries.
- Main content sections contain the editable form fields and final action state.
- Do not visually merge the side panel and the form into one narrow centered column on large screens.
- Desktop layouts should occupy the available viewport gracefully with `max-w-7xl` while retaining comfortable line lengths inside cards.
- On mobile, panels and sections stack with consistent vertical gaps and no nested decorative cards.

## CTA Emphasis Rules

- The final submit action should be the most visually dominant button.
- Use the primary blue-to-indigo gradient, larger sizing, and stronger shadow for the generation CTA.
- Success states use `CheckCircle`, emerald text, and a soft emerald-tinted panel or badge.
- Error states use `AlertCircle`, rose text, and a soft rose-tinted panel.
- Neutral ready states use slate text with a document icon.

## Error, Loading, And Success State Rules

- Field errors use `AlertCircle` plus text.
- Form-level errors summarize what blocked completion.
- Success states use `CheckCircle` and confirm the outcome.
- Loading states disable repeated actions and keep layout stable.
- Use `aria-live="polite"` for form-level status updates.

## Do And Don't Examples

Do:

- Use clear semantic icons.
- Keep icon sizes consistent with the 16/20/24 scale.
- Pair important icons with text.
- Use template cards when choices need descriptions and selected states.
- Use shared components before writing page-specific controls.
- Keep section separation spacious and light.

Don't:

- Overuse icons on every line of text.
- Mix random icon sizes in the same component.
- Choose icons because they look nice but do not match the action.
- Use default checkboxes as the primary control for rich template choices.
- Hide labels and rely on icons or placeholders alone.
- Mix raw browser inputs with generic UI components in the same form.

## Reusing Components On Future Pages

Import shared components from the UI barrel:

```tsx
import { Button, PageHeader, SectionHeader, TextInput } from "@/src/components/ui";
```

Use semantic Lucide icons with the shared props:

```tsx
<TextInput
  error={errors.clientName}
  label="Client Name"
  leadingIcon={<Building2 className="h-5 w-5" />}
  name="clientName"
  onChange={handleChange}
  placeholder="Acme Consulting"
  required
  value={values.clientName}
/>
```

When a page needs a form, start with section cards, use `SectionHeader` for each task group, and use shared controls before adding page-specific styling.
