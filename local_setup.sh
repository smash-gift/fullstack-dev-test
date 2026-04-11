#!/bin/bash

# Configuration
DEFAULT_MODEL="gemini-2.0-flash"

# Helper for colorful output
print_step() { echo -e "\n\033[1;34m==>\033[0m $1"; }
print_error() { echo -e "\033[1;31mError:\033[0m $1"; exit 1; }
print_success() { echo -e "\033[1;32mSuccess:\033[0m $1"; }

# Usage
usage() {
    echo "Usage: $0 --api-key <YOUR_GEMINI_API_KEY> [--model <MODEL_NAME>]"
    echo ""
    echo "Options:"
    echo "  --api-key    Your Google Gemini API Key (required)"
    echo "  --model      The LLM model to use (default: $DEFAULT_MODEL)"
    exit 1
}

# Parse arguments
LLM_API_KEY=""
LLM_MODEL=$DEFAULT_MODEL

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --api-key) LLM_API_KEY="$2"; shift ;;
        --model) LLM_MODEL="$2"; shift ;;
        -h|--help) usage ;;
        *) echo "Unknown parameter passed: $1"; usage ;;
    esac
    shift
done

if [ -z "$LLM_API_KEY" ]; then
    print_error "Missing required parameter --api-key"
fi

print_step "Setting up environment files..."
cat <<EOF > api/.env
LLM_API_KEY=$LLM_API_KEY
LLM_MODEL=$LLM_MODEL
EOF
print_success "api/.env created."

print_step "Installing Backend dependencies (api)..."
cd api && pnpm install || print_error "Failed to install backend dependencies. Make sure pnpm is installed."
cd ..

print_step "Installing Frontend dependencies (app)..."
cd app && flutter pub get || print_error "Failed to install app dependencies. Make sure Flutter is installed."
cd ..

print_step "Setup Complete!"
echo "--------------------------------------------------------"
echo "To start the backend (Firebase Emulator):"
echo "  cd api && pnpm run serve"
echo ""
echo "To start the Flutter app (pointing to local emulator):"
echo "  cd app"
echo "  flutter run --flavor development --target lib/main_development.dart --dart-define=API_BASE_URL=http://localhost:5001/message-suggester/us-central1/api"
echo "--------------------------------------------------------"
