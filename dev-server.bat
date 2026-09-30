@echo off
setlocal
REM GitHupWebsite - Local dev server (Windows)
REM Usage: dev-server.bat [--no-dev-mode] [port]
REM   port            default: 8000
REM   --no-dev-mode   render the site and demo exactly as production would
REM
REM Copies site\ into .dev\public, generates 90 days of example data for the
REM demo monitors in .githup.yml, builds the GitHup status page into
REM .dev\public\demo and serves it all with python -m http.server, so /demo/
REM works locally just like https://githup.stux.group/demo/.
REM
REM GitHup itself is found at %GITHUP_PATH%, else ..\GitHup (a sibling checkout),
REM else it is cloned into .dev\GitHup.
REM DEV_MODE is on by default: the demo shows GitHup's DEV MODE banner and the
REM website shows its own on localhost (?nodev=1 hides the website's banner).

set "DIR=%~dp0"
set "PORT=8000"
set "DEV_MODE=1"

:args
if "%~1"=="" goto run
if /i "%~1"=="--no-dev-mode" (
    set "DEV_MODE=0"
) else (
    set "PORT=%~1"
)
shift
goto args

:run
cd /d "%DIR%"
set "GITHUP=%GITHUP_PATH%"
if not "%GITHUP%"=="" goto found
if exist "%DIR%..\GitHup\githup\__init__.py" (
    set "GITHUP=%DIR%..\GitHup"
    goto found
)
set "GITHUP=%DIR%.dev\GitHup"
if not exist "%GITHUP%" git clone --depth 1 https://github.com/StuxGroup/GitHup.git "%GITHUP%" || exit /b 1

:found
set "PYTHONPATH=%GITHUP%"
set "PYTHONDONTWRITEBYTECODE=1"

if exist .dev\public rmdir /s /q .dev\public
xcopy site .dev\public\ /e /i /q >nul || exit /b 1
REM CHANGELOG.md and VERSION.md feed /changelogs/ and the footer version link.
copy /y CHANGELOG.md .dev\public\ >nul || exit /b 1
copy /y VERSION.md .dev\public\ >nul || exit /b 1
python -m githup demo --config .githup.yml --data-dir .dev/data || exit /b 1
python -m githup site --config .githup.yml --data-dir .dev/data --incidents-file .dev/data/incidents.json --out .dev/public/demo --no-deploy || exit /b 1

if "%DEV_MODE%"=="1" (
    echo GitHup website ^(DEV_MODE=1^) at http://127.0.0.1:%PORT%/  -  demo at http://127.0.0.1:%PORT%/demo/
) else (
    echo GitHup website ^(production rendering^) at http://127.0.0.1:%PORT%/?nodev=1  -  demo at http://127.0.0.1:%PORT%/demo/
)
python -m http.server %PORT% --bind 127.0.0.1 --directory .dev/public
