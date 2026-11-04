import assert from "node:assert/strict"
import { commentRuns, prefixesFor } from "./detect.ts"

const run = (text: string, path = "a.py") =>
  commentRuns(text, { prefixes: prefixesFor(path), maxRun: 1 })

// 1. multi-line comment block: 4 lines → flagged with location
assert.deepEqual(run("# a\n# b\n# c\n# d\nfoo: 1", "ci.yml"), [
  { start: 1, end: 4, count: 4, preview: "# a" },
])

// 2. single comment line passes
assert.equal(run("x = 1\n# note\ny = 2").length, 0)

// 3. TODO ticket markers are exempt, but plain lines around them still count
assert.equal(run("# todo ABC-1: fix\n# b\n# c").length, 1)
assert.equal(run("# todo ABC-1: fix\n# b").length, 0)

// 4. js: '#' is not a comment (private fields), '//' block is flagged
assert.equal(run("class A {\n  #private() {}\n}\n// a\n// b", "a.ts").length, 1)
assert.deepEqual(run("function f() {}\n// a\n// b", "a.js")[0].count, 2)

// 5. linter pragmas and type: ignore are exempt
assert.equal(run("import os  # type: ignore\n# a").length, 0)

// 6. multi-line javadoc/block comments are flagged; single-line block is not
assert.equal(run("/** one line */").length, 0)
assert.deepEqual(run("/** a\n * b\n */\ncode()", "a.java")[0], { start: 1, end: 3, count: 3, preview: "/** a" })

// 7. shebang exempt even inside a block of hashes
assert.equal(run("#!/usr/bin/env bash\n# real\n# block").length, 1)

// 8. trailing inline comments don't count
assert.equal(run("code()  # note\nother()  # note2").length, 0)

// 9. write-over-existing: pre-existing lines are not counted as additions
const existing = new Set(["# keep: already there", "code: 1"].join("\n").split("\n"))
assert.equal(
  commentRuns("# keep: already there\n# fresh\nkey: 2", { prefixes: ["#"], maxRun: 1, existing }).length,
  0,
)
assert.equal(
  commentRuns("# keep: already there\n# fresh a\n# fresh b\nkey: 2", { prefixes: ["#"], maxRun: 1, existing }).length,
  1,
)

// 10. markdown headings are not comments; html comments are
assert.equal(run("# Heading\nText").length, 0)
assert.equal(run("<!-- a\nb -->", "a.md").length, 1)

// 11. sql -- comments
assert.equal(run("select 1;\n-- a\n-- b", "q.sql").length, 1)

// 12. ponytail: markers are exempt
assert.equal(run("// ponytail: global lock, per-account locks if throughput matters\n// plain").length, 0)

// 13. strings containing // at line start are not flagged (quote wins)
assert.equal(run('const u = "https://x"\n// real\n// block', "a.ts").length, 1)

console.log("detect: all 13 checks passed")
