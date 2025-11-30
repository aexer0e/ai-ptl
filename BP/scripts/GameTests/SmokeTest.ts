import { world } from "@minecraft/server";
import { Test, register } from "@minecraft/server-gametest";

// ============================================
// SMOKE TESTS - Core system verification
// ============================================

/**
 * Test that verifies world is accessible.
 */
register("ns_tpl", "world_access", (test: Test) => {
    const overworld = world.getDimension("overworld");
    test.assert(overworld !== undefined, "Overworld should be accessible");
    test.succeed();
})
    .structureName("ns_tpl:platform_5x5")
    .maxTicks(20);
