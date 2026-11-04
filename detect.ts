// Pure comment-detection logic. No imports so it stays testable with plain node.

export interface CommentRun {
  start: number // 1-based
  end: number // 1-based, inclusive
  count: number
  preview: string
}

const BLOCK_PAIRS: [string, string][] = [
  ["/*", "*/"],
  ["<!--", "-->"],
]

// Exempt at any length: shebangs, TODO <ticket>/FIXME/ponytail: markers, linter pragmas (noqa, type: ignore, eslint-disable, ...)
const ALLOWED =
  /^\s*(#!|ponytail:|todo\b|fixme\b|noqa|type:\s*ignore|pragma|eslint-disable|prettier-disable|stylelint-disable|nolint|istanbul\b|coverage:)/i

const STRIP = /^(<!--|\/\*|#|\/\/|--|;|\*)\s*/

const EXT: Record<string, string[]> = {
  js: ["//"], mjs: ["//"], cjs: ["//"], jsx: ["//"], ts: ["//"], tsx: ["//"],
  java: ["//"], go: ["//"], rs: ["//"], c: ["//"], h: ["//"], cpp: ["//"],
  hpp: ["//"], cc: ["//"], cxx: ["//"], swift: ["//"], kt: ["//"], kts: ["//"],
  scala: ["//"], php: ["//"], cs: ["//"], groovy: ["//"], gradle: ["//"],
  dart: ["//"], zig: ["//"], sol: ["//"], m: ["//"], mm: ["//"],
  py: ["#"], pyi: ["#"], sh: ["#"], bash: ["#"], zsh: ["#"], fish: ["#"],
  yaml: ["#"], yml: ["#"], toml: ["#"], rb: ["#"], rake: ["#"], gemspec: ["#"],
  tf: ["#"], tfvars: ["#"], properties: ["#"], env: ["#"], editorconfig: ["#"], npmrc: ["#"],
  ini: ["#", ";"], cfg: ["#", ";"], conf: ["#", ";"],
  sql: ["--"], lua: ["--"], hs: ["--"], elm: ["--"],
  md: ["<!--"], html: ["<!--"], xml: ["<!--"], svg: ["<!--"], vue: ["<!--"], svelte: ["<!--"],
}

// Extensionless files (Makefile, Dockerfile, .gitlab-ci-style CI configs) land here.
const DEFAULT = ["#", "//"]

export function prefixesFor(path: string): string[] {
  const ext = path.slice(path.lastIndexOf(".") + 1).toLowerCase()
  return EXT[ext] ?? DEFAULT
}

export function commentRuns(
  text: string,
  opts: { prefixes: string[]; maxRun: number; existing?: Set<string> },
): CommentRun[] {
  const lines = text.split("\n")
  const isComment: boolean[] = []
  let blockClose: string | null = null
  for (const line of lines) {
    const t = line.trimStart()
    if (blockClose !== null) {
      isComment.push(true)
      if (t.includes(blockClose)) blockClose = null
      continue
    }
    let hit = false
    for (const [open, close] of BLOCK_PAIRS) {
      if (t.startsWith(open)) {
        hit = true
        if (!t.includes(close, open.length)) blockClose = close
        break
      }
    }
    if (!hit) hit = opts.prefixes.some((p) => t.startsWith(p))
    isComment.push(hit)
  }

  const violations: CommentRun[] = []
  let start = -1
  let count = 0
  for (let i = 0; i <= lines.length; i++) {
    let counted = false
    if (i < lines.length && isComment[i]) {
      const t = lines[i].trimStart()
      const allowed = ALLOWED.test(t) || ALLOWED.test(t.replace(STRIP, ""))
      const preexisting = opts.existing !== undefined && opts.existing.has(lines[i])
      counted = !allowed && !preexisting
    }
    if (counted) {
      if (start < 0) start = i
      count++
    } else {
      if (count > opts.maxRun) {
        violations.push({ start: start + 1, end: start + count, count, preview: lines[start].trim().slice(0, 60) })
      }
      start = -1
      count = 0
    }
  }
  return violations
}
