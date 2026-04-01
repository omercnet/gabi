module.exports = (api) => {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
    plugins: [
      // Transform import.meta.env → undefined for non-module script compatibility.
      // Zustand devtools middleware uses import.meta.env.MODE which causes
      // "Cannot use 'import.meta' outside a module" in Expo web export
      // because Metro outputs classic scripts, not ES modules.
      function importMetaEnvPlugin() {
        return {
          visitor: {
            MetaProperty(path) {
              if (path.node.meta.name === "import" && path.node.property.name === "meta") {
                path.parentPath.replaceWith(path.parentPath.scope.buildUndefinedNode());
              }
            },
          },
        };
      },
    ],
  };
};
