const { withPodfile } = require("expo/config-plugins");

const withPodfileFix = (config) => {
    return withPodfile(config, (config) => {
        const podfileContent = config.modResults.contents;

        const fixCode = `
    # Fix for "non-portable path" warnings (Yoga case mismatch)
    public_headers_path = File.join(installer.sandbox.root, 'Headers', 'Public')
    yoga_path = File.join(public_headers_path, 'Yoga')
    yoga_symlink_path = File.join(public_headers_path, 'yoga')

    if File.directory?(yoga_path) && !File.exist?(yoga_symlink_path)
      puts "Creating 'yoga' symlink for Xcode case-sensitivity fix..."
      File.symlink('Yoga', yoga_symlink_path)
    end

    # Silence nullability warnings for ExpoModulesCore
    installer.pods_project.targets.each do |target|
      if target.name == 'ExpoModulesCore'
        target.build_configurations.each do |config|
          config.build_settings['WARNING_CFLAGS'] ||= ['$(inherited)']
          config.build_settings['WARNING_CFLAGS'] << '-Wno-nullability-completeness'
        end
      end
    end
    `;

        // Only inject if not already present (checking for a unique string in fixCode)
        if (!podfileContent.includes("Creating 'yoga' symlink")) {
            // Inject after react_native_post_install(...)
            // We look for the closing parenthesis of react_native_post_install call
            // warning: this regex relies on standard formatting
            const regex = /(react_native_post_install\([\s\S]*?\n\s+\))/;

            if (regex.test(podfileContent)) {
                config.modResults.contents = podfileContent.replace(
                    regex,
                    `$1\n${fixCode}`
                );
            } else {
                // Fallback: Check if we can just append to post_install block via standard append?
                // No, withPodfile gives raw string.
                console.warn("Could not find react_native_post_install to inject code. Check Podfile structure.");
            }
        }

        return config;
    });
};

module.exports = withPodfileFix;
