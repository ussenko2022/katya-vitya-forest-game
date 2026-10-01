$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$lines = Get-Content (Join-Path $PSScriptRoot 'voice-lines.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$voiceDir = Join-Path $projectRoot 'dist\assets\voice'
New-Item -ItemType Directory -Force $voiceDir | Out-Null
Add-Type -AssemblyName System.Speech
$speaker = [System.Speech.Synthesis.SpeechSynthesizer]::new()
$speaker.SelectVoice('Microsoft Irina Desktop')
$speaker.Rate = -1
$speaker.Volume = 95
$tempWave = Join-Path ([System.IO.Path]::GetTempPath()) 'katya-vitya-voice.wav'
foreach ($line in $lines) {
  $target = Join-Path $voiceDir $line.file
  if (Test-Path $target) { continue }
  $speaker.SetOutputToWaveFile($tempWave)
  $speaker.Speak([string]$line.text)
  $speaker.SetOutputToNull()
  & ffmpeg -y -loglevel error -i $tempWave -codec:a libmp3lame -qscale:a 6 $target
  if ($LASTEXITCODE -ne 0) { throw "Audio conversion failed for $($line.file)" }
}
$speaker.Dispose()
Remove-Item -LiteralPath $tempWave -ErrorAction SilentlyContinue
Write-Output "Generated $($lines.Count) audio files."
