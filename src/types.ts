export interface ProjectMetrics {
    // General
    id: string;
    name: string;
    sector: string;
    isEligible: boolean;
    phase: string; // Added Phase as it is mentioned in key features (Data Detail List)

    // Petal: Resilience & Regeneration
    resilience: {
        euiReduction: number; // calculated from (Baseline - Predicted) / Baseline
        meets2030Goal: boolean; // true if euiReduction >= 0.80
        operationalCarbonReduction: number | null;
        embodiedCarbonPathway: string; // e.g., "TBD", "Tracking"
        indoorWaterReduction: number;
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
