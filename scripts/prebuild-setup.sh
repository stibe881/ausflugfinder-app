#!/bin/bash
# Create .expo directory with proper permissions before prebuild
mkdir -p .expo/web
chmod 777 .expo
chmod 777 .expo/web
echo "Created .expo directory with permissions"
