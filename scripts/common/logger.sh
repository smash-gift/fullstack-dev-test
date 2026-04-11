#!/bin/bash
print_step() { echo -e "\n\033[1;34m==>\033[0m $1"; }
print_error() { echo -e "\033[1;31mError:\033[0m $1"; exit 1; }
print_success() { echo -e "\033[1;32mSuccess:\033[0m $1"; }
