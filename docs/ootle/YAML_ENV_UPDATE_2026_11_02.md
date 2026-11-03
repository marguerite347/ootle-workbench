# YAML and environment utility update

Update root js-yaml 4.3.2 to 5.5.0, dotenv 8.6.0 to 18.0.9 and dotenv-cli 8.0.0 to 11.1.0. Keep distinct transitive versions required by tools. The editor uses YAML for formatter settings; test selection uses the dotenv CLI with an explicit environment file.

Selection receipt: reuse the installed Yarn lockfile, existing config-utility test harness and real production build. A small isolated trial first checked nested YAML settings, malformed input, special property names, dotenv parsing and CLI environment precedence using synthetic data only. The same tests passed against the integrated dependency tree alongside TOML/beautifier/source-map regressions.

The production build passed. Installation required the already prepared isolated Node 24.22.2 toolchain because selenium-webdriver rejects the host's 24.19.0; no global runtime update or engine bypass was used. No real environment file or credentials were read by the new tests.
