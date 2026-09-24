@echo off
rem Windows entry point for `metaverse <command>`. The real logic is in scripts\metaverse.mjs.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Download the LTS version from https://nodejs.org, then run: metaverse setup
  exit /b 1
)
node "%~dp0scripts\metaverse.mjs" %*
