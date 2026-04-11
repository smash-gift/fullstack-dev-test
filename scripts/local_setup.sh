#!/bin/bash

# Get the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$DIR/common/vars.sh"
source "$DIR/common/logger.sh"

# Usage
usage() {
    echo "Usage: $0 [--api-key <YOUR_GEMINI_API_KEY>] [--model <MODEL_NAME>]"
    echo ""
    echo "Options:"
    echo "  --api-key    Your Google Gemini API Key (required if api/.env does not exist)"
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

cd "$DIR/.."

if [ -z "$LLM_API_KEY" ]; then
    if [ ! -f "api/.env" ]; then
        print_error "Missing required parameter --api-key and api/.env does not exist."
    else
        print_step "Skipping .env creation (already exists and no --api-key provided)."
    fi
else
    print_step "Setting up environment files..."
    cat <<EOF > api/.env
LLM_API_KEY=$LLM_API_KEY
LLM_MODEL=$LLM_MODEL
EOF
    print_success "api/.env created."
fi

print_step "Installing Backend dependencies (api)..."
cd api && pnpm install || print_error "Failed to install backend dependencies."
cd ..

print_step "Installing Frontend dependencies (app)..."
cd app && flutter pub get || print_error "Failed to install app dependencies."
cd ..

print_success "Setup Complete!"
