@echo off
setlocal

:: Get directory
set "DIR=%~dp0"
set "ROOT=%DIR%.."

call "%DIR%common\logger.bat" print_step "Running setup..."
call "%DIR%local_setup.bat" %*
if errorlevel 1 exit /b 1

cd /d "%ROOT%"

call "%DIR%common\logger.bat" print_step "Starting Backend (Firebase Emulator) in a new window..."
cd api
start "Firebase Emulator" cmd /c "pnpm run serve"
cd ..

call "%DIR%common\logger.bat" print_step "Starting Frontend (Flutter app)..."
cd app
call flutter run --flavor development --target lib/main_development.dart --dart-define=API_BASE_URL=http://localhost:5001/message-suggester/us-central1/api

call "%DIR%common\logger.bat" print_success "Flutter app closed."
echo To stop the backend, close the Firebase Emulator command window.
