# Tessera

A discipleship and spiritual-formation platform (frontend only; a mock service layer stands in for the backend).

Planning documents live in [`docs/`](docs): product, design, architecture, API contract and roadmap. Conventions for contributors and agents are in [`CLAUDE.md`](CLAUDE.md).

## Run it

```
pnpm install
pnpm dev            # http://localhost:3000
pnpm check          # typecheck, lint, unit tests
pnpm check:contrast # colour-token contrast gate
pnpm build && pnpm e2e
```

Start at `/design` for the component gallery and `/app/today` for the app shell.
