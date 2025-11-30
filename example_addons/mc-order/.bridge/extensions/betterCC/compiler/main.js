export default ({ projectRoot, fileSystem, options }) => {
    return {
        async buildStart() {
            const files_rel_dir = "/.bridge/extensions/betterCC/files/";

            // Globally accessible object to store data
            self.bCC = {
                _isDevelopment: options.mode === "development",
            };

            // Get files to import from index.json
            const files_dir = projectRoot + files_rel_dir;
            const index_path = files_dir + "index.json";
            const index = await fileSystem.readJson(index_path);
            const files_to_import = index.files;

            for (let file_name of files_to_import) {
                // Read files and eval them
                let file = await fileSystem.readFile(files_dir + file_name);
                let file_text = await file.text();
                let output = eval(file_text);
                self.bCC[output.name] = output;
            }
        },
    };
};
