$ErrorActionPreference = 'Stop'
$ltRoot = $PSScriptRoot
$ltNode = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $ltNode) {
  $ltBundled = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
  if (Test-Path -LiteralPath $ltBundled) { $ltNode = $ltBundled }
}
if (-not $ltNode) { throw 'Install Node.js 22 or newer, then run this script again.' }
Push-Location -LiteralPath $ltRoot
try { & $ltNode 'server/main.mjs' } finally { Pop-Location }
