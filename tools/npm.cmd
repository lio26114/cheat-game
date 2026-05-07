:: Created by npm, please don't edit manually.
@ECHO OFF

SETLOCAL

SET "NODE_EXE=%~dp0\node.exe"
IF NOT EXIST "%NODE_EXE%" (
  SET "NODE_EXE=node"
)

SET "NPM_CLI_JS=%~dp0\node_modules\npm\lib\cli.js"
IF NOT EXIST "%NPM_CLI_JS%" (
  SET "NPM_CLI_JS=%~dp0\lib\cli.js"
)

"%NODE_EXE%" "%NPM_CLI_JS%" %*
