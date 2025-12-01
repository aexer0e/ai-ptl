// Atmosphere+ Module Index
// This file initializes all Atmosphere+ systems

import AetherLensManager from "./AetherLensManager";
import EmitterManager from "./EmitterManager";
import TunerUI from "./TunerUI";

export { AetherLensManager, EmitterManager, TunerUI };

export function initAtmosphere() {
    EmitterManager.init();
    TunerUI.init();
    AetherLensManager.init();
    AetherLensManager.initTunerWandReveal();
}
