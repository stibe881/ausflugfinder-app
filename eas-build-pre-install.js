#!/usr/bin/env node

/**
 * EAS Build Pre-Install Hook
 * This script runs before npm/pnpm install during EAS builds.
 * It creates the .expo directory with proper permissions to fix EACCES errors.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('[eas-build-pre-install] Starting pre-install setup...');

const directories = [
    '.expo',
    '.expo/web',
    '.expo/web/cache',
];

// Create directories with proper permissions
directories.forEach((dir) => {
    const dirPath = path.join(process.cwd(), dir);
    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true, mode: 0o777 });
            console.log(`[eas-build-pre-install] Created directory: ${dirPath}`);
        }
        // Set permissions to 777 to ensure write access
        fs.chmodSync(dirPath, 0o777);
        console.log(`[eas-build-pre-install] Set permissions for: ${dirPath}`);
    } catch (error) {
        console.error(`[eas-build-pre-install] Error creating ${dirPath}:`, error.message);
    }
});

console.log('[eas-build-pre-install] Pre-install setup completed!');
