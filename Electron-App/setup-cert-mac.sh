#!/bin/bash

# macOS Self-Signed Certificate Setup for Peter Marker
# This script helps create and trust a self-signed certificate for code signing

echo "======================================"
echo "Peter Marker - Self-Signed Certificate Setup"
echo "======================================"
echo ""

CERT_NAME="Peter Marker Developer"
KEYCHAIN="login"

echo "This script will create a self-signed certificate for code signing."
echo "Certificate Name: $CERT_NAME"
echo ""

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Error: This script only works on macOS"
    exit 1
fi

# Check if certificate already exists
if security find-certificate -c "$CERT_NAME" "$KEYCHAIN.keychain" &> /dev/null; then
    echo "⚠️  Certificate '$CERT_NAME' already exists in $KEYCHAIN keychain"
    read -p "Do you want to delete and recreate it? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Deleting existing certificate..."
        security delete-certificate -c "$CERT_NAME" "$KEYCHAIN.keychain"
        echo "✅ Certificate deleted"
    else
        echo "ℹ️  Keeping existing certificate"
        exit 0
    fi
fi

echo ""
echo "Creating self-signed certificate..."
echo "You may be prompted for your macOS password."
echo ""

# Create the certificate
cat > /tmp/cert-config.txt << EOF
[ req ]
distinguished_name = req_distinguished_name
x509_extensions = v3_ca

[ req_distinguished_name ]
CN = $CERT_NAME

[ v3_ca ]
keyUsage = critical, digitalSignature
extendedKeyUsage = critical, codeSigning
basicConstraints = critical, CA:false
EOF

# Generate private key and certificate
openssl req -x509 -newkey rsa:4096 -keyout /tmp/key.pem -out /tmp/cert.pem -days 3650 -nodes -config /tmp/cert-config.txt -subj "/CN=$CERT_NAME"

# Convert to p12 format
openssl pkcs12 -export -out /tmp/cert.p12 -inkey /tmp/key.pem -in /tmp/cert.pem -passout pass:

# Import to keychain
security import /tmp/cert.p12 -k "$KEYCHAIN.keychain" -T /usr/bin/codesign -T /usr/bin/productsign

echo ""
echo "✅ Certificate created and imported to $KEYCHAIN keychain"
echo ""

# Clean up
rm /tmp/key.pem /tmp/cert.pem /tmp/cert.p12 /tmp/cert-config.txt

echo "Now we need to trust this certificate for code signing."
echo "This requires your macOS password."
echo ""

# Trust the certificate for code signing
security set-key-partition-list -S apple-tool:,apple: -s -k $(security find-generic-password -wa "login" 2>/dev/null || echo "") "$KEYCHAIN.keychain" &> /dev/null

# Alternative: Open Keychain Access to manually trust
osascript <<EOF
tell application "Keychain Access"
    activate
end tell

display dialog "Please complete these steps in Keychain Access:

1. Find the certificate: '$CERT_NAME'
2. Double-click the certificate
3. Expand the 'Trust' section
4. Set 'Code Signing' to 'Always Trust'
5. Close the window (enter password when prompted)

Click OK when done." buttons {"OK"} default button "OK"
EOF

echo ""
echo "======================================"
echo "✅ Setup Complete!"
echo "======================================"
echo ""
echo "Certificate '$CERT_NAME' is now ready for code signing."
echo ""
echo "To build the app with this certificate:"
echo ""
echo "  export CSC_NAME=\"$CERT_NAME\""
echo "  npm run build:mac"
echo ""
echo "Or add to your ~/.zshrc or ~/.bash_profile:"
echo ""
echo "  export CSC_NAME=\"$CERT_NAME\""
echo ""
