import { spawnSync } from "node:child_process";

const root = "d:\\PROJETS\\afrestyle";
const r = spawnSync("npx", ["tsc", "--noEmit", "--pretty", "false"], {
  cwd: root,
  encoding: "utf8",
});
console.log(String(r.stdout ?? "").slice(0, 4000));
console.log(String(r.stderr ?? "").slice(0, 4000));
console.log("exit=" + r.status);
