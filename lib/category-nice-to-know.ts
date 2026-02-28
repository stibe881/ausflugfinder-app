/**
 * Category-dependent "Nice to Know" options.
 * Each excursion category has its own set of allowed nice-to-know items,
 * organized by sub-categories (Ausstattung, Verpflegung, Zugang, Sonstiges).
 */

export interface NiceToKnowGroup {
    category: string;
    options: string[];
}

/**
 * All available excursion categories.
 */
export const KATEGORIE_OPTIONS: string[] = [
    "Abenteuerweg",
    "Chugeliweg",
    "Erlebnisbad",
    "Freizeitpark",
    "Gastronomie",
    "Museum & Kultur",
    "Wandern",
    "Schnitzeljagd",
    "Spielplatz",
    "Sport & Action",
    "Stadt & Sightseeing",
    "Tierpark & Zoos",
    "Sonstiges",
];

/**
 * Mapping of each category to its allowed nice-to-know options, grouped by sub-category.
 */
const CATEGORY_NICE_TO_KNOW: Record<string, NiceToKnowGroup[]> = {
    "Abenteuerweg": [
        {
            category: "Ausstattung",
            options: ["Aussenspielplatz", "Picknicktische", "WC vorhanden"],
        },
        {
            category: "Verpflegung",
            options: ["Grillstelle", "Restaurant", "Kiosk"],
        },
        {
            category: "Zugang",
            options: ["Kinderwagentauglich", "Barrierefrei"],
        },
        {
            category: "Sonstiges",
            options: ["Chugelibahn", "Smartphone zwingend nötig", "Wasserspiel"],
        },
    ],
    "Chugeliweg": [
        {
            category: "Ausstattung",
            options: ["Aussenspielplatz", "Innenspielplatz", "Picknicktische", "Spielplatz abgeschirmt von der Strasse", "WC vorhanden"],
        },
        {
            category: "Verpflegung",
            options: ["Grillstelle", "Restaurant", "Kiosk"],
        },
        {
            category: "Zugang",
            options: ["Kinderwagentauglich", "Barrierefrei"],
        },
        {
            category: "Sonstiges",
            options: ["Chugelibahn", "Wasserspiel"],
        },
    ],
    "Erlebnisbad": [
        {
            category: "Ausstattung",
            options: ["Aussenspielplatz", "Innenspielplatz", "Picknicktische"],
        },
        {
            category: "Verpflegung",
            options: ["Grillstelle", "Restaurant", "Kiosk"],
        },
        {
            category: "Sonstiges",
            options: ["kleine Badewelt", "mittlere Badewelt", "grosse Badewelt"],
        },
    ],
    "Freizeitpark": [
        {
            category: "Ausstattung",
            options: ["Picknicktische"],
        },
        {
            category: "Verpflegung",
            options: ["Grillstelle", "Restaurant", "Kiosk"],
        },
        {
            category: "Sonstiges",
            options: ["kleiner Park", "mittlerer Park", "grosser Park"],
        },
    ],
    "Gastronomie": [
        {
            category: "Ausstattung",
            options: ["Aussenspielplatz", "Innenspielplatz", "Spielplatz abgeschirmt von der Strasse", "Kinderstühle", "Malsets", "Kindermenüs"],
        },
        {
            category: "Sonstiges",
            options: ["Kinderfreundlich"],
        },
    ],
    "Museum & Kultur": [
        {
            category: "Ausstattung",
            options: ["Aussenspielplatz", "Innenspielplatz", "Picknicktische", "Spielplatz abgeschirmt von der Strasse", "Grillstelle", "Restaurant", "Kiosk"],
        },
        {
            category: "Zugang",
            options: ["Kinderwagentauglich", "Barrierefrei"],
        },
    ],
    "Wandern": [
        {
            category: "Ausstattung",
            options: ["Aussenspielplatz", "Innenspielplatz", "Picknicktische", "Spielplatz abgeschirmt von der Strasse", "WC vorhanden"],
        },
        {
            category: "Verpflegung",
            options: ["Grillstelle", "Restaurant", "Kiosk"],
        },
        {
            category: "Zugang",
            options: ["Kinderwagentauglich", "Barrierefrei"],
        },
        {
            category: "Sonstiges",
            options: ["Chugelibahn", "Wasserspiel"],
        },
    ],
    "Schnitzeljagd": [
        {
            category: "Ausstattung",
            options: ["Aussenspielplatz", "Innenspielplatz", "Picknicktische", "Spielplatz abgeschirmt von der Strasse", "WC vorhanden"],
        },
        {
            category: "Verpflegung",
            options: ["Grillstelle", "Restaurant", "Kiosk"],
        },
        {
            category: "Zugang",
            options: ["Kinderwagentauglich", "Barrierefrei"],
        },
        {
            category: "Sonstiges",
            options: ["Chugelibahn", "Wasserspiel", "Smartphone zwingend nötig"],
        },
    ],
    "Spielplatz": [
        {
            category: "Ausstattung",
            options: ["Aussenspielplatz", "Innenspielplatz", "Picknicktische", "Spielplatz abgeschirmt von der Strasse", "WC vorhanden"],
        },
        {
            category: "Verpflegung",
            options: ["Grillstelle", "Restaurant", "Kiosk"],
        },
        {
            category: "Zugang",
            options: ["Kinderwagentauglich", "Barrierefrei"],
        },
        {
            category: "Sonstiges",
            options: ["Wasserspiel"],
        },
    ],
    "Sport & Action": [
        {
            category: "Ausstattung",
            options: ["Aussenspielplatz", "Innenspielplatz", "WC vorhanden"],
        },
        {
            category: "Verpflegung",
            options: ["Grillstelle", "Restaurant", "Kiosk"],
        },
        {
            category: "Zugang",
            options: ["Kinderwagentauglich", "Barrierefrei"],
        },
    ],
    "Stadt & Sightseeing": [
        {
            category: "Ausstattung",
            options: ["Aussenspielplatz", "Innenspielplatz", "Picknicktische", "Spielplatz abgeschirmt von der Strasse", "WC vorhanden"],
        },
        {
            category: "Verpflegung",
            options: ["Grillstelle", "Restaurant", "Kiosk"],
        },
        {
            category: "Zugang",
            options: ["Kinderwagentauglich", "Barrierefrei"],
        },
        {
            category: "Sonstiges",
            options: ["Chugelibahn", "Wasserspiel", "Smartphone zwingend nötig"],
        },
    ],
    "Tierpark & Zoos": [
        {
            category: "Ausstattung",
            options: ["Aussenspielplatz", "Innenspielplatz", "Picknicktische", "Spielplatz abgeschirmt von der Strasse", "WC vorhanden"],
        },
        {
            category: "Verpflegung",
            options: ["Grillstelle", "Restaurant", "Kiosk"],
        },
        {
            category: "Zugang",
            options: ["Kinderwagentauglich", "Barrierefrei"],
        },
        {
            category: "Sonstiges",
            options: ["Chugelibahn", "Wasserspiel"],
        },
    ],
};

/**
 * Get the nice-to-know options for the given selected categories.
 * Merges options from all selected categories, deduplicating within each sub-category.
 */
export function getNiceToKnowForCategories(selectedCategories: string[]): NiceToKnowGroup[] {
    if (selectedCategories.length === 0) return [];

    // Collect all sub-category options, deduplicating
    const merged: Record<string, Set<string>> = {};
    const subCategoryOrder: string[] = [];

    for (const cat of selectedCategories) {
        const groups = CATEGORY_NICE_TO_KNOW[cat];
        if (!groups) continue;
        for (const group of groups) {
            if (!merged[group.category]) {
                merged[group.category] = new Set();
                subCategoryOrder.push(group.category);
            }
            for (const opt of group.options) {
                merged[group.category].add(opt);
            }
        }
    }

    return subCategoryOrder.map(cat => ({
        category: cat,
        options: Array.from(merged[cat]),
    }));
}
