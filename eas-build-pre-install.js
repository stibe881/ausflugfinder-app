#!/usr/bin/env node

/**
 * EAS Build Pre-Install Hook
 * This script runs before npm/pnpm install during EAS builds.
 * It changes ownership of the build directory to fix EACCES permission errors.
 * 
 * Based on: https://github.com/expo/eas-cli/issues/2005
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('[eas-build-pre-install] Starting permission fix...');

try {
    // Get current user
    const currentUser = process.env.USER || 'expo';
    console.log(`[eas-build-pre-install] Current user: ${currentUser}`);

    // Change ownership of the entire build directory to the current user
    console.log('[eas-build-pre-install] Changing ownership of build directory...');
    execSync(`sudo chown -R ${currentUser}:staff .`, { stdio: 'inherit' });

    // Create .expo directories with proper permissions
    const directories = ['.expo', '.expo/web', '.expo/web/cache'];
    directories.forEach((dir) => {
        const dirPath = path.join(process.cwd(), dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true, mode: 0o777 });
            console.log(`[eas-build-pre-install] Created: ${dirPath}`);
        }
    });

    // Clean node_modules and reinstall (optional, helps with permission issues)
    if (fs.existsSync('node_modules')) {
        console.log('[eas-build-pre-install] Cleaning node_modules...');
        execSync('rm -rf node_modules', { stdio: 'inherit' });
    }

    console.log('[eas-build-pre-install] Permission fix completed!');
} catch (error) {
    console.error('[eas-build-pre-install] Error:', error.message);
    // Don't fail the build, continue anyway
}
