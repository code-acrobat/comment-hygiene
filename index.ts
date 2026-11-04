import * as fs from "node:fs"
import { Plugin } from "@opencode/plugin"
import { commentRuns, prefixesFor } from "./detect"

const DEFAULT_MAX_RUN = 1

// Throws to reject the tool call; V1 passes output.args, V2 passes event.input.
function check(tool: string, args: unknown, maxRun: number): void {
  if (tool !== "edit" && tool !== "write") return
  const a = (args ?? {}) as Record<string, unknown>
  const path = (a.path ?? a.filePath ?? "") as string
  const text = tool === "edit" ? a.newString : a.content
  if (typeof path !== "string" || typeof text !== "string" || text === "") return

  let existing: Set<string> | undefined
  if (tool === "write") {
    try {
      // ponytail: set-based diff of old lines, LCS if false negatives bite
      existing = new Set(fs.readFileSync(path, "utf8").split("\n"))
    } catch {
      /* new file — everything is an addition */
    }
  }

  const run = commentRuns(text, { prefixes: prefixesFor(path), maxRun, existing })[0]
  if (!run) return

  throw new Error(
    `comment-hygiene: ${run.count} consecutive comment lines at ${path}:${run.start}-${run.end} (max ${maxRun}) — "${run.preview}". ` +
      `Explanations belong in the git commit message: compress to at most ${maxRun} line, name things better, or drop it. ` +
      `Exempt markers (TODO <ticket>:, FIXME, ponytail:, linter pragmas like type: ignore / noqa / eslint-disable) never count. ` +
      `Re-apply the edit without the comment block; leave pre-existing comments alone.`,
  )
}

export default {
  ...Plugin.define({
    id: "comment-hygiene",
    async setup(ctx) {
      const raw = Number((ctx.options as { maxRun?: number } | undefined)?.maxRun ?? DEFAULT_MAX_RUN)
      const maxRun = Number.isFinite(raw) ? raw : DEFAULT_MAX_RUN
      await ctx.tool.hook("execute.before", (event) => check(event.tool, event.input, maxRun))
    },
  }),
  // OpenCode V1, 1.18.29+ object form
  async server() {
    return {
      "tool.execute.before": async (
        input: { tool: string },
        output: { args: unknown },
      ) => check(input.tool, output.args, DEFAULT_MAX_RUN),
    }
  },
}
