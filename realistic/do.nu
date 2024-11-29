# This is a Nushell script designed for my own use.

# Build and install the 'build-support' module
export def bs [] {
    cd $env.DO_DIR

    do {
        cd build-support
        npm install
        npm run build
        npm pack
    }

    npm install --save-dev ./build-support/electron-playground_realistic_build-support-1.0.0.tgz
}