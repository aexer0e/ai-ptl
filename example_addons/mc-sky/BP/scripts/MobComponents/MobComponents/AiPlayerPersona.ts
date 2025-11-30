import { Entity, system } from "@minecraft/server";
import Names from "Game/Names";
import EntityStore from "Store/Entity/EntityStore";
import BroadcastUtil from "Utilities/BroadcastUtil";
import MathUtil from "Utilities/MathUtil";
import MobComponent from "./MobComponent";

export const joinedNames = new Set<string>();

export default class extends MobComponent {
    static readonly EntityTypes = ["gm1_sky:ai_player"];

    constructor(entity: Entity) {
        super(entity, 5);

        if (EntityStore.get(entity, "name").length == 0) {
            const nameTypeRoll = MathUtil.random(0, 1);
            let name: string;

            if (nameTypeRoll > 0.95) {
                name = this.pickPresetName();
            } else if (nameTypeRoll > 0.975) {
                name = this.pickStaffName();
            } else {
                name = this.generateName();
            }
            EntityStore.set(entity, "name", name);
            entity.nameTag = name;
        } else {
            entity.nameTag = EntityStore.get(entity, "name");
        }

        if (EntityStore.get(entity, "bodytypeSkin") == -1) {
            this.setBodyTypeSkin(entity);
            this.setBaseSkin(entity);
            this.setPantsSkin(entity);
            this.setShirtsSkin(entity);
            this.setEyesSkin(entity);
            this.setEyesColorSkin(entity);
            this.setMouthSkin(entity);
            this.setMouthColorSkin(entity);
            this.setHairSkin(entity);
            this.setHairColorSkin(entity);
        }

        if (!joinedNames.has(entity.nameTag)) {
            BroadcastUtil.translate("multiplayer.player.joined", [entity.nameTag], null, "§e");

            EntityStore.set(entity, "lastLoginTick", system.currentTick);
            if (EntityStore.get(entity, "firstLoginTick") == 0) {
                EntityStore.set(entity, "firstLoginTick", system.currentTick);
            }

            joinedNames.add(entity.nameTag);
        }
    }

    pickPresetName() {
        const maxLengthPresetNames = Names.Presets.length;
        const randomPresetNameIndex = MathUtil.randomInt(0, maxLengthPresetNames);
        return Names.Presets[randomPresetNameIndex];
    }

    pickStaffName() {
        const maxLengthStaffNames = Names.Staff.length;
        const randomStaffNameIndex = MathUtil.randomInt(0, maxLengthStaffNames);
        return Names.Staff[randomStaffNameIndex];
    }

    getNamePart(list: Array<string>) {
        const maxLengthNouns = list.length;
        const randomNounIndex = MathUtil.randomInt(0, maxLengthNouns);
        return list[randomNounIndex];
    }

    generateName() {
        let adj = "";
        let underscore = "";
        let number = "";
        let noun = this.getNamePart(Names.Nouns);

        const adjectiveRoll = MathUtil.random(0, 1);
        const adjectiveThreshold = 0.2;

        if (adjectiveRoll > adjectiveThreshold) {
            adj = this.getNamePart(Names.Adjectives);
        }

        const underscoreRoll = MathUtil.random(0, 1);
        const underscoreThreshold = 0.6;
        if (adj.length != 0) {
            if (underscoreRoll > underscoreThreshold) {
                const doubleUnderscoreRoll = MathUtil.random(0, 1);
                const doubleUnderscoreThreshhold = 0.8;
                if (doubleUnderscoreRoll > doubleUnderscoreThreshhold) {
                    underscore = "__";
                } else {
                    underscore = "_";
                }
            }
        }

        //changes adjective case
        const caseRoll = MathUtil.random(0, 1);
        const caseThresholdUpper = 0.6;
        const caseThresholdLower = 0.3;

        if (adj.length != 0) {
            if (caseRoll > caseThresholdLower && caseRoll <= caseThresholdUpper) {
                if (caseRoll > (caseThresholdLower + caseThresholdUpper) / 2) {
                    adj = adj.toLowerCase() + "_";
                } else {
                    adj = adj.toUpperCase() + "_";
                }
            }
        }

        //swaps adjective letters with numbers
        let adjResult = "";
        let nounResult = "";
        const swapAdjThreshold = 0.5;
        const swapNounThreshold = 0.75;
        const charMap = {
            i: "1",
            o: "0",
            a: "4",
            e: "3",
            s: "5",
            t: "7",
            I: "1",
            O: "0",
            A: "4",
            E: "3",
            S: "5",
            T: "7",
        };

        if (adj.length != 0) {
            for (const char of adj) {
                if (char in charMap && Math.random() > swapAdjThreshold) {
                    adjResult += charMap[char];
                    adj = adjResult;
                } else {
                    adjResult += char;
                    adj = adjResult;
                }
            }
        }
        //makes names more interesting if they is no adjective
        if (adj.length == 0 && noun.length != 0) {
            for (const char of noun) {
                if (char in charMap && Math.random() > swapNounThreshold) {
                    nounResult += charMap[char];
                    noun = nounResult;
                } else {
                    nounResult += char;
                    noun = nounResult;
                }
            }
        }

        //generates numbers
        if (noun.length != 0 && adj.length <= 5) {
            const numberRoll = Math.random();
            const numberThreshold = 0.5;
            const restrictedNumbers = [69, 420, 1488, 8964];

            if (numberRoll > numberThreshold) {
                let numberGen;
                do {
                    const rangeRoll = Math.random();
                    if (rangeRoll < 0.15) {
                        numberGen = Math.floor(Math.random() * 10); // Generates a random integer between 0 and 9
                    } else if (rangeRoll < 0.35) {
                        numberGen = Math.floor(Math.random() * 90) + 10; // Generates a random integer between 0 and 99
                    } else if (rangeRoll < 0.65) {
                        numberGen = Math.floor(Math.random() * 900) + 100; // Generates a random integer between 0 and 999
                    } else if (rangeRoll < 0.85) {
                        numberGen = 1970 + Math.floor(Math.random() * 61); // Generates a random integer between 1970 and 2030
                    } else {
                        numberGen = Math.floor(Math.random() * 9000) + 1000; // Generates a random integer between 0 and 9999
                    }
                } while (restrictedNumbers.includes(numberGen));
                number = numberGen.toString();
            }
        }

        return adj + underscore + noun + number;
    }

    setBodyTypeSkin(entity: Entity) {
        if (EntityStore.get(entity, "bodytypeSkin") == -1) {
            const classicChance = Math.random();
            let bodytypeRoll;
            if (classicChance < 0.1) {
                bodytypeRoll = 10;
            } else {
                bodytypeRoll = MathUtil.randomInt(1, 9);
            }
            EntityStore.set(entity, "bodytypeSkin", bodytypeRoll);
        }
        const bodytypeSkin = EntityStore.get(entity, "bodytypeSkin");
        entity.setProperty("gm1_sky:bodytype", bodytypeSkin);
    }

    setBaseSkin(entity: Entity) {
        const entityName = EntityStore.get(entity, "name");
        const nameIndex = Names.Staff.indexOf(entityName);

        // Check if baseSkin is already set
        if (EntityStore.get(entity, "baseSkin") == -1) {
            let baseRoll: number;

            if (EntityStore.get(entity, "bodytypeSkin") == 10) {
                // If the name is found, use the index as the baseRoll
                if (nameIndex !== -1) {
                    baseRoll = nameIndex + 100;
                } else {
                    baseRoll = MathUtil.randomInt(40, 61);
                }
            } else {
                const baseWeight = MathUtil.random(0, 1);

                if (baseWeight < 0.05) {
                    // 5% chance minecraft colors
                    baseRoll = Math.floor(MathUtil.randomInt(19, 34));
                } else {
                    // 95% chance skin colors
                    baseRoll = Math.floor(MathUtil.randomInt(0, 19));
                }
            }

            EntityStore.set(entity, "baseSkin", baseRoll);
        }

        const baseSkin = EntityStore.get(entity, "baseSkin");
        entity.setProperty("gm1_sky:base", baseSkin);
    }

    setPantsSkin(entity: Entity) {
        if (EntityStore.get(entity, "pantsSkin") == -1) {
            const pantsRoll = MathUtil.randomInt(0, 28);
            EntityStore.set(entity, "pantsSkin", pantsRoll);
        }
        const pantsSkin = EntityStore.get(entity, "pantsSkin");
        entity.setProperty("gm1_sky:pants", pantsSkin);
    }

    setShirtsSkin(entity: Entity) {
        if (EntityStore.get(entity, "shirtSkin") == -1) {
            const shirtRoll = MathUtil.randomInt(0, 51);
            EntityStore.set(entity, "shirtSkin", shirtRoll);
        }
        const shirtSkin = EntityStore.get(entity, "shirtSkin");
        entity.setProperty("gm1_sky:shirt", shirtSkin);
    }

    setEyesSkin(entity: Entity) {
        if (EntityStore.get(entity, "eyesSkin") == -1) {
            let eyesRoll;
            const eyesWeight = MathUtil.random(0, 1);
            if (eyesWeight < 0.125) {
                // 37.5% chance for special eyes (values between 38 and 51)
                eyesRoll = Math.floor(MathUtil.randomInt(38, 52));
            } else {
                // 62.5% chance for plain eyes (values between 0 and 38)
                eyesRoll = Math.floor(MathUtil.randomInt(0, 38));
            }
            EntityStore.set(entity, "eyesSkin", eyesRoll);
        }
        const eyesSkin = EntityStore.get(entity, "eyesSkin");
        entity.setProperty("gm1_sky:eyes", eyesSkin);
    }

    setEyesColorSkin(entity: Entity) {
        if (EntityStore.get(entity, "eyesColorSkin") == -1) {
            const eyesColorRoll = MathUtil.randomInt(0, 34);
            EntityStore.set(entity, "eyesColorSkin", eyesColorRoll);
        }
        const eyesColorSkin = EntityStore.get(entity, "eyesColorSkin");
        entity.setProperty("gm1_sky:eyes_color", eyesColorSkin);
    }

    setMouthSkin(entity: Entity) {
        if (EntityStore.get(entity, "mouthSkin") == -1) {
            let mouthRoll;
            const mouthWeight = MathUtil.random(0, 1);
            if (mouthWeight < 0.375) {
                // 37.5% chance for special mouths (values between 10 and 28)
                mouthRoll = Math.floor(MathUtil.randomInt(10, 29));
            } else {
                // 62.5% chance for plain mouths (values between 0 and 9)
                mouthRoll = Math.floor(MathUtil.randomInt(0, 10));
            }
            EntityStore.set(entity, "mouthSkin", mouthRoll);
        }
        const mouthSkin = EntityStore.get(entity, "mouthSkin");
        entity.setProperty("gm1_sky:mouth", mouthSkin);
    }

    setMouthColorSkin(entity) {
        // Ensure baseSkin is set before calculating mouthColorSkin
        const baseSkin = EntityStore.get(entity, "baseSkin");
        if (baseSkin == -1) {
            throw new Error("baseSkin must be set before setting mouthColorSkin");
        }

        if (EntityStore.get(entity, "mouthColorSkin") == -1) {
            let mouthColorRoll;
            // Apply custom logic based on baseSkin value
            if (baseSkin <= 8) {
                // If baseSkin is less or equal to 8, 75% chance for values between 0 and 8, 25% chance for values between 9 and 16
                const mouthColorWeight = MathUtil.random(0, 1);
                if (mouthColorWeight < 0.75) {
                    mouthColorRoll = Math.floor(MathUtil.randomInt(0, 9));
                } else {
                    mouthColorRoll = Math.floor(MathUtil.randomInt(9, 17));
                }
            } else if (8 < baseSkin && baseSkin <= 19) {
                // If baseSkin is between 9 and 19, choose values between 9 and 16
                mouthColorRoll = Math.floor(MathUtil.randomInt(11, 16));
            } else {
                // If baseSkin is 20 or greater, 75% chance for values between 0 and 16, 25% chance for values between 17 and 29
                const mouthColorWeight = MathUtil.random(0, 1);
                if (mouthColorWeight < 0.75) {
                    mouthColorRoll = Math.floor(MathUtil.randomInt(0, 17));
                } else {
                    mouthColorRoll = Math.floor(MathUtil.randomInt(17, 30));
                }
            }
            EntityStore.set(entity, "mouthColorSkin", mouthColorRoll);
        }
        const mouthColorSkin = EntityStore.get(entity, "mouthColorSkin");
        entity.setProperty("gm1_sky:mouth_color", mouthColorSkin);
    }

    setHairSkin(entity: Entity) {
        if (EntityStore.get(entity, "hairSkin") == -1) {
            const hairRoll = MathUtil.randomInt(0, 129);
            EntityStore.set(entity, "hairSkin", hairRoll);
        }
        const hairSkin = EntityStore.get(entity, "hairSkin");
        entity.setProperty("gm1_sky:hair", hairSkin);
    }

    setHairColorSkin(entity: Entity) {
        // Ensure baseSkin is set before calculating hairColorSkin
        const baseSkin = EntityStore.get(entity, "baseSkin");
        if (baseSkin == -1) {
            throw new Error("baseSkin must be set before setting hairColorSkin");
        }

        if (EntityStore.get(entity, "hairColorSkin") == -1) {
            let hairColorRoll;
            // Apply custom logic based on baseSkin value
            if (baseSkin <= 8) {
                // If baseSkin is less or equal to 8, 75% chance for values between 0 and 12, 25% chance for values between 13 and 35
                const hairColorWeight = MathUtil.random(0, 1);
                if (hairColorWeight < 0.75) {
                    hairColorRoll = Math.floor(MathUtil.randomInt(0, 13));
                } else {
                    hairColorRoll = Math.floor(MathUtil.randomInt(13, 36));
                }
            } else if (8 < baseSkin && baseSkin <= 19) {
                // If baseSkin is between 8 and 19, 75% chance for values between 13 and 22, 25% chance for values outside this range
                const hairColorWeight = MathUtil.random(0, 1);
                if (hairColorWeight < 0.75) {
                    hairColorRoll = Math.floor(MathUtil.randomInt(13, 23));
                } else if (hairColorWeight < 0.875) {
                    hairColorRoll = Math.floor(MathUtil.randomInt(0, 13));
                } else {
                    hairColorRoll = Math.floor(MathUtil.randomInt(23, 36));
                }
            } else {
                // If baseSkin is 20 or greater, 75% chance for values between 0 and 22, 25% chance for values between 23 and 35
                const hairColorWeight = MathUtil.random(0, 1);
                if (hairColorWeight < 0.75) {
                    hairColorRoll = Math.floor(MathUtil.randomInt(0, 23));
                } else {
                    hairColorRoll = Math.floor(MathUtil.randomInt(23, 36));
                }
            }
            EntityStore.set(entity, "hairColorSkin", hairColorRoll);
        }
        const hairColorSkin = EntityStore.get(entity, "hairColorSkin");
        entity.setProperty("gm1_sky:hair_color", hairColorSkin);
    }
}
