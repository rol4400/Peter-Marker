// afterPack hook for electron-builder
// Cleans macOS extended attributes after packaging but before code signing

const { execSync } = require('child_process');

exports.default = async function(context) {
    const { appOutDir, packager } = context;
    const platform = packager.platform.name;
    
    if (platform === 'mac') {
        console.log('Cleaning macOS extended attributes after pack...');
        
        try {
            // Clean the entire output directory
            execSync(`xattr -cr "${appOutDir}"`, { stdio: 'inherit' });
            console.log(`✓ Cleaned ${appOutDir}`);
            
            // Also clean the frameworks specifically
            const frameworksPath = `${appOutDir}/*.app/Contents/Frameworks`;
            try {
                execSync(`find "${appOutDir}" -name "*.app" -exec xattr -cr {} \\;`, { stdio: 'inherit' });
                console.log('✓ Cleaned all .app bundles');
            } catch (e) {
                console.log('Note: Could not clean some app bundles, continuing...');
            }
            
            console.log('✓ Extended attributes cleaned successfully before signing');
        } catch (err) {
            console.warn('Warning: Could not clean all extended attributes:', err.message);
            // Don't fail the build, just warn
        }
    }
    
    return true;
};
