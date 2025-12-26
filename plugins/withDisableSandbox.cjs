const { withXcodeProject } = require("expo/config-plugins");

const withDisableSandbox = (config) => {
  return withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    
    for (const key in configurations) {
      const configuration = configurations[key];
      if (configuration.buildSettings) {
        configuration.buildSettings.ENABLE_USER_SCRIPT_SANDBOXING = "NO";
      }
    }
    
    return config;
  });
};

module.exports = withDisableSandbox;
