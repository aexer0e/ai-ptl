export default defineComponent(({ name, template }) => {
    name("gm1_ord:onboarding_book_state");
    template((data, { create }) => {
        const TEMPLATE = {
            description: {
                properties: {
                    "gm1_ord:onboarding_book": {
                        client_sync: true,
                        type: "enum",
                        default: "main_page",
                        values: ["main_page", "settings_page", "credits_page", "changelog_page", "crafting_page1", "crafting_page2", "crafting_page3", "crafting_page4", "crafting_page5", "crafting_page6", "crafting_page7", "crafting_page8", "crafting_page9", "crafting_page10", "crafting_page11", "intro_page0", "intro_page1", "intro_page2", "intro_page3", "intro_page4", "character_sonic", "character_tails", "character_knuckles", "character_amy", "character_shadow", "quest_super_shadow", "quest_super_sonic", "quest_eggman", "quest_chaos_machine", "quest_emerald0", "quest_emerald1", "quest_emerald2", "quest_emerald3", "quest_emerald4", "quest_emerald5", "quest_emerald6", "quest_emerald7","crafting_page12", "crafting_page13", ],
                    },


                },
            },
        };
        create(TEMPLATE);
    });
});