# Lovable Prompt Library — How to Use

Five production-grade prompts, one per vertical: nail salon, barber shop, beauty salon, attorney, dentist.

## How to use

1. Open [lovable.dev](https://lovable.dev) and start a new project.
2. Paste the entire contents of the relevant `.md` file as your first message.
3. Let Lovable generate. Review the output — check for any hardcoded strings or Lovable branding that slipped through.
4. Copy the generated components into `client-site-template/src/components/<vertical>/` and the route file into `src/routes/index.tsx` (under a vertical-specific route if you add multi-vertical routing later).
5. Wire the components to `useClientConfig()` — Lovable will have generated them reading from the config already, since the prompt specifies this. Verify no hardcoded strings remain (`grep -r '"Jacksonville"' src/components/<vertical>/`).
6. Add a theme file at `src/themes/<vertical>.ts` with the vertical's default colors and section order.
7. Test with `?prospect=<place_id>` to confirm prospect data swaps in correctly.

## Shared components

The `<BookingForm />` (non-dentist verticals) and `<DentistCallbackForm />` are generated once and reused. Do not regenerate them per vertical — just import from `@/components/`.

The `/api/book` server function is shared. Create it once from whichever vertical you generate first.
