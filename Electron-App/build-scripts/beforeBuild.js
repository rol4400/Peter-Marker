// beforeBuild hook for electron-builder
// Cleans macOS extended attributes before code signing

const { execSync } = require('child_process');
const path = require('path');

exports.default = async function(context) {
    const platform = context.platform.name;
    
    if (platform === 'mac') {
        console.log('Cleaning macOS extended attributes before build...');
        
        try {
            const distPath = path.join(__dirname, '..', 'dist');
            const nodemodulesPath = path.join(__dirname, '..', 'node_modules', 'electron');
            
            // Clean dist folder if it exists
            try {
                execSync(`xattr -cr "${distPath}"`, { stdio: 'inherit' });
                console.log('✓ Cleaned dist folder');
            } catch (e) {
                // Dist folder might not exist yet, ignore
            }
            
            // Clean electron in node_modules
            try {
                execSync(`xattr -cr "${nodemodulesPath}"`, { stdio: 'inherit' });
                console.log('✓ Cleaned electron node_modules');
            } catch (e) {
                console.log('Note: Could not clean electron node_modules, continuing...');
            }
            
            console.log('✓ Extended attributes cleaned successfully');
        } catch (err) {
            console.warn('Warning: Could not clean all extended attributes:', err.message);
            // Don't fail the build, just warn
        }
    }
    
    return true;
};
