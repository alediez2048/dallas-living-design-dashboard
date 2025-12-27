export interface ProjectMetrics {
    // General
    id: string;
    name: string;
    sector: string;
    isEligible: boolean;
    eligibilityStatus: string;
    phase: string; // Added Phase as it is mentioned in key features (Data Detail List)
    archVsInt: string; // "Architecture" vs "Interiors"

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
}

export interface SectorStats {
    sector: string;
    projectCount: number;
    avgEuiReduction: number;
    avgWaterReduction: number;
    meetingEuiGoalCount: number;
    meetingWaterGoalCount: number;
}
