# comment-hygiene

OpenCode plugin (V1 + V2) that rejects `edit`/`write` tool calls adding more
than one consecutive comment line. Explanations belong in the commit message.
Exempt markers: `TODO <ticket>:`, `FIXME`, `ponytail:`, shebangs, linter pragmas
(`type: ignore`, `noqa`, `eslint-disable`, ...). Rewrites of existing files
only count lines that are actually new.

## Install

npm (recommended): reference `"@codeacrobat/comment-hygiene"` in your opencode
config's `"plugins"` — done.

```sh
./install.sh
```

Copies `index.ts` + `detect.ts` to
`~/.config/opencode/plugins/comment-hygiene` — the config plugins dir
auto-loads in every opencode session (V2, omac sandboxes included), no
config entry needed. Uninstall: `rm -rf ~/.config/opencode/plugins/comment-hygiene`.

Per-project alternative: copy this directory into the project as
`.opencode/plugins/comment-hygiene/`. No package.json needed; hot-loads on
save.

## Options (V2 only)

```jsonc
{ "plugins": [{ "package": "./.opencode/plugins/comment-hygiene", "options": { "maxRun": 2 } }] }
```

`maxRun` (default 1): max consecutive comment lines per block.

## Test

`node --experimental-strip-types detect.test.ts` (node >= 22.6)
