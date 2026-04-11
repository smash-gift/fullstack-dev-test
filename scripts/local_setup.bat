@echo off
setlocal DisableDelayedExpansion

:: Get directory
set "DIR=%~dp0"
set "ROOT=%DIR%.."

call "%DIR%common\vars.bat"
set "LLM_API_KEY="
set "LLM_MODEL=%DEFAULT_MODEL%"

:parse_args
if "%~1"=="" goto end_args
if "%~1"=="--api-key" (
    set "LLM_API_KEY=%~2"
    shift
    shift
    goto parse_args
)
if "%~1"=="--model" (
    set "LLM_MODEL=%~2"
    shift
    shift
    goto parse_args
)
if "%~1"=="-h" goto usage
if "%~1"=="--help" goto usage
echo Unknown parameter passed: %1
goto usage

:usage
echo Usage: %~nx0 [--api-key ^<YOUR_GEMINI_API_KEY^>] [--model ^<MODEL_NAME^>]
echo.
echo Options:
echo   --api-key    Your Google Gemini API Key (required if api\.env does not exist)
echo   --model      The LLM model to use (default: %DEFAULT_MODEL%)
exit /b 1

:end_args

cd /d "%ROOT%"

if "%LLM_API_KEY%"=="" (
    if not exist "api\.env" (
        call "%DIR%common\logger.bat" print_error "Missing required parameter --api-key and api\.env does not exist."
        exit /b 1
    ) else (
        call "%DIR%common\logger.bat" print_step "Skipping .env creation (already exists and no --api-key provided)."
    )
) else (
    call "%DIR%common\logger.bat" print_step "Setting up environment files..."
    echo LLM_API_KEY=%LLM_API_KEY% > api\.env
    echo LLM_MODEL=%LLM_MODEL% >> api\.env
    call "%DIR%common\logger.bat" print_success "api\.env created."
)

call "%DIR%common\logger.bat" print_step "Installing Backend dependencies (api)..."
cd api
call pnpm install
if errorlevel 1 (
    cd ..
    call "%DIR%common\logger.bat" print_error "Failed to install backend dependencies."
    exit /b 1
)
cd ..

call "%DIR%common\logger.bat" print_step "Installing Frontend dependencies (app)..."
cd app
call flutter pub get
if errorlevel 1 (
    cd ..
    call "%DIR%common\logger.bat" print_error "Failed to install app dependencies."
    exit /b 1
)
cd ..

call "%DIR%common\logger.bat" print_success "Setup Complete!"
