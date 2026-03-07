export interface ProjectMetrics {
    // General
    id: string; // Unique identifier for the project
    name: string; // Client Name / Project Name
    reportingYear: number; // The calendar year this project's data belongs to (e.g. 2024, 2025, 2026)
    sector: string; // Practice Area / Sector
    isEligible: boolean;
    eligibilityStatus: string;
    phase: string; // Project Phase
    archVsInt: string; // Architecture vs Interiors distinctioned in key features (Data Detail List)
    euiGuidanceLevel: number | null; // EUI Guidance Level 1-5, null if not assigned

    // Petal: Resilience & Regeneration
    resilience: {
        euiReduction: number; // calculated from (Baseline - Predicted) / Baseline
        meets2030Goal: boolean; // true if euiReduction >= 0.80
        operationalCarbonReduction: number | null;
        embodiedCarbonPathway: string; // e.g., "TBD", "Tracking"
        indoorWaterReduction: number;
        outdoorWaterReduction: number | null; // derived from "PW Outdoor Water"
        meetsOutdoorWaterGoal: boolean; // true if explicit "Yes" OR (outdoorWaterReduction > 0.50)
        lpdReduction: number | null; // Added: derived from "LPD 2030 Goal"
        meetsLpdGoal: boolean; // true if explicit "Yes" in "Meet 2030 LPD"
        meetsWaterGoal: boolean; // true if indoorWaterReduction >= 0.40
        ecologyScore: number; // derived from "Ecology - 4 Total Questions"
        resilienceScore: number; // derived from "Resilience - 1~3 Total Question"
    };

    // Petal: Health & Well-being
    health: {
        switchListVetted: boolean; // "Switch List Vetted" == "Yes"
        airScore: number;
        lightScore: number;
        thermalComfortScore: number;
        acousticScore: number;
        waterQualityScore: number;
        biophiliaScore: number;
    };

    // New: Design Drivers / Petals Performance
    designPerformance: {
        poeticsBeautyScore: number | null; // Column BB
        conceptualClarityScore: number | null; // Column S
        researchInnovationScore: number | null; // Column T
        communityInclusionScore: number | null; // Column V
        resilienceRegenerationScore: number | null; // Column AG
        healthWellbeingScore: number | null; // Column AR
        technologyTectonicsScore: number | null; // Column AI(?)
    };
}

export interface SectorStats {
    sector: string;
    projectCount: number;
    avgEuiReduction: number;
    avgWaterReduction: number;
    meetingEuiGoalCount: number;
    meetingWaterGoalCount: number;
}
