@echo off
if "%~1"=="print_step" (
    echo.
    echo ==^> %~2
    exit /b 0
)
if "%~1"=="print_error" (
    echo Error: %~2
    exit /b 1
)
if "%~1"=="print_success" (
    echo Success: %~2
    exit /b 0
)
