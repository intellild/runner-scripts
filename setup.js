const os = require("node:os");
const shell = require("shelljs");
const prettier = require("prettier");
const fs = require("node:fs");
const path = require("node:path");
const { program } = require("commander");

program
  .option(
    "-s, --source <source>",
    "runner archive, for example: actions-runner-osx-arm64-2.304.0.tar.gz"
  )
  .option("-t, --token <token>")
  .option("-u, --url <url>")
  .option("-n, --count <count>", "number of runner", (value) => Number(value));

program.parse();

const { source, token, url, count } = program.opts();

const args = `--unattended --url ${url} --token ${token}`;

const prefix = os.hostname();

const apps = [];

shell.config.silent = false;
shell.config.fatal = true;

for (let i = 0; i < count; i++) {
  const dir = `runner-${i}`;
  shell.exec(`tar xzf ${source} -C ${dir}`);
  shell.pushd(dir);
  shell.exec(`./config.sh remove --token ${token}`);
  shell.exec(`./config.sh ${args} --name ${prefix}-${i}`);
  shell.popd();
  apps.push({
    name: dir,
    cwd: dir,
    script: `run.sh`,
    interpreter: "/bin/bash",
    exec_mode: "fork",
    watch: false,
  });
}

const config = prettier.format(JSON.stringify({ apps }), { parser: "json" });
fs.writeFileSync(path.resolve(__dirname, "config.generated.json"), config);
