#!/usr/bin/env node

/**
 * EAS Build Post-Install Hook (runs after npm install, before prebuild)
 * Creates .expo directory with proper permissions.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('[eas-build-post-install] Creating .expo directories...');

const directories = [
    '.expo',
    '.expo/web',
    '.expo/web/cache',
];

directories.forEach((dir) => {
    const dirPath = path.join(process.cwd(), dir);
    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true, mode: 0o777 });
        }
        fs.chmodSync(dirPath, 0o777);
        console.log(`[eas-build-post-install] Created: ${dirPath}`);
    } catch (error) {
        console.error(`[eas-build-post-install] Error: ${error.message}`);
        // Try with shell command as fallback
        try {
            execSync(`mkdir -p "${dirPath}" && chmod 777 "${dirPath}"`, { stdio: 'inherit' });
        } catch (e) {
            console.error(`[eas-build-post-install] Shell fallback failed: ${e.message}`);
        }
    }
});

console.log('[eas-build-post-install] Done!');
