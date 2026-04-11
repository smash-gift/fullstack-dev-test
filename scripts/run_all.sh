#!/bin/bash

# Get the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$DIR/common/logger.sh"

print_step "Running setup..."
"$DIR/local_setup.sh" "$@" || exit 1

cd "$DIR/.."

print_step "Starting Backend (Firebase Emulator) in background..."
cd api
# Run serving in background
pnpm run serve &
API_PID=$!
cd ..

print_step "Starting Frontend (Flutter app)..."
cd app
flutter run --flavor development --target lib/main_development.dart --dart-define=API_BASE_URL=http://localhost:5001/message-suggester/us-central1/api

print_step "Shutting down..."
kill $API_PID
wait $API_PID 2>/dev/null
print_success "All processes stopped."
