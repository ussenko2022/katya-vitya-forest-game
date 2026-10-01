$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$python = Join-Path $projectRoot '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $python)) { $python = 'python' }
& $python -m PyInstaller --noconfirm --clean --onefile --windowed `
  --name ForestGameLauncher `
  --distpath $projectRoot `
  --workpath (Join-Path $projectRoot 'build') `
  --specpath (Join-Path $projectRoot 'build') `
  (Join-Path $projectRoot 'launcher.py')
if ($LASTEXITCODE -ne 0) { throw 'PyInstaller build failed' }
Write-Output (Join-Path $projectRoot 'ForestGameLauncher.exe')
