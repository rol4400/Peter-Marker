// afterAllArtifactBuild hook for electron-builder
// This script zips the Chrome Extension and adds it to the GitHub release

const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

exports.default = async function(context) {
    console.log('Creating Chrome Extension ZIP for GitHub release...');
    
    const chromeExtensionDir = path.join(__dirname, '..', '..', 'Chrome-Extension');
    const outputDir = path.join(__dirname, '..', 'dist');
    const outputFile = path.join(outputDir, 'Peter-Marker-Chrome-Extension.zip');
    
    // Check if Chrome-Extension directory exists
    if (!fs.existsSync(chromeExtensionDir)) {
        console.warn(`Warning: Chrome-Extension directory not found at ${chromeExtensionDir}`);
        return [];
    }
    
    // Create dist directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Remove old zip if it exists
    if (fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile);
    }
    
    await new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputFile);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });
        
        output.on('close', () => {
            console.log(`✓ Chrome Extension ZIP created: ${archive.pointer()} bytes`);
            console.log(`  Location: ${outputFile}`);
            resolve();
        });
        
        archive.on('error', (err) => {
            console.error('Error creating Chrome Extension ZIP:', err);
            reject(err);
        });
        
        archive.pipe(output);
        
        // Add the Chrome-Extension directory contents
        archive.directory(chromeExtensionDir, false);
        
        archive.finalize();
    });
    
    // Return the file path so it gets included in the GitHub release
    return [outputFile];
};
