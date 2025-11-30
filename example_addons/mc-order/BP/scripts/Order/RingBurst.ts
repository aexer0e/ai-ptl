import { Dimension } from "@minecraft/server";
import MathUtil from "Utilities/MathUtil";
import V3 from "Wrappers/V3";

export default class RingBurst {
    static RingBurst(
        dimension: Dimension,
        origin: V3,
        minCount: number,
        maxCount: number,
        minXZImpulse: number,
        maxXZImpulse,
        minYIMpulse: number,
        maxYIMpulse: number
    ) {
        const ringCount = MathUtil.randomInt(minCount, maxCount + 1);

        for (let i = 0; i < ringCount; i++) {
            const ring = dimension.spawnEntity("gm1_ord:ring<gm1_ord:dropped_ring>", origin);
            ring.setProperty("gm1_ord:give_amount", 1);

            const xForce = Math.random() * (maxXZImpulse - minXZImpulse) + minXZImpulse;
            const impulse = V3.fromYaw(MathUtil.random(0, Math.PI * 2))
                .normalize()
                .multiply(xForce);
            impulse.y = Math.random() * (maxYIMpulse - minYIMpulse) + minYIMpulse;
            ring.applyImpulse(impulse);
        }
    }
}
