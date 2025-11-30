let blockComponentsRemoved = 0
let texturesRemoved = 0
let terrainTextureEntriesRemoved = 0
let modelsRemoved = 0

function removeAxiomComponent(blockFileContent){
    if(blockFileContent['minecraft:block'].hasOwnProperty('axiom:bedrock')) {
        blockComponentsRemoved++
        delete blockFileContent['minecraft:block']['axiom:bedrock']
    }
    return blockFileContent;
}

function removeAxiomTextureListEntries(terrainTextureContent){
    const textureEntries = terrainTextureContent['texture_data']
    for(const textureEntry in textureEntries){
        if(textureEntry.includes('axiom_')){
            terrainTextureEntriesRemoved++
            delete textureEntries[textureEntry]
        }
    }
    return terrainTextureContent
}

function removeNonAxiomTextureListEntries(terrainTextureContent){
    const textureEntries = terrainTextureContent['texture_data']
    for(const textureEntry in textureEntries){
        if(!textureEntry.includes('axiom_')){
            terrainTextureEntriesRemoved++
            delete textureEntries[textureEntry]
        }
    }
    return terrainTextureContent
}

export default ({ options }) => {
    return {
        async buildStart() {
            this.enabled = options.enabled
            this.logVerbose = options.log
            this.blockPath = "BP/blocks"
            this.axiomBlockPath = "BP/blocks/axiom/"
            this.terrainTexturePath = "RP/textures/terrain_texture.json"
            this.modelsPath = "RP/models/blocks/axiom_"
            this.texturePath = "RP/textures/blocks/axiom/"
        },
        async transform(filePath, content) {
            if (this.enabled){
                //if(filePath.includes(this.terrainTexturePath)) return removeNonAxiomTextureListEntries(content)
            } else {
                if(filePath.includes(this.blockPath)) return removeAxiomComponent(content)
                if(filePath.includes(this.terrainTexturePath)) return removeAxiomTextureListEntries(content)
            }
        },
        async transformPath(filePath){
            if (this.enabled) return filePath;
            if(filePath.includes(this.modelsPath)){
                modelsRemoved++
                return null;
            }
            if(filePath.includes(this.texturePath)){
                texturesRemoved++
                return null;
            }
            if(filePath.includes(this.axiomBlockPath)){
                blockComponentsRemoved++
                return null;
            }
        },
        buildEnd(){
            if(!this.logVerbose) return
            if(this.enabled) {
                console.log(`Removed ${terrainTextureEntriesRemoved} non Axiom Terrain Texture Entries.`)
            } else {
                console.log(`Removed Axiom support. ${blockComponentsRemoved} Block Components, ${texturesRemoved} Textures, ${terrainTextureEntriesRemoved} Terrain Texture Entries, and ${modelsRemoved} Models.`)
            }
        }
    };
};
