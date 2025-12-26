import { ProjectMetrics } from '../types';

/**
 * Generates realistic sample data for demo mode
 */
export const generateSampleData = (): ProjectMetrics[] => {
    const sectors = ['K12', 'Higher ED', 'CCC', 'Healthcare DIV', 'Workplace'];
    const phases = ['SD', 'DD', 'CD', 'CA', 'Complete'];
    const eligibilityStatuses = ['Yes', 'TBD', 'No 2026', 'No'];

    const projectNames = [
        // K12
        'Lincoln Elementary School Renovation',
        'Central High School STEM Wing',
        'Riverside Middle School Expansion',

        // Higher ED
        'State University New Science Building',
        'Community College Library Renovation',
        'Tech Institute Student Center',

        // CCC
        'City Museum Expansion',
        'Public Library Downtown Branch',
        'Community Arts Center',

        // Healthcare DIV
        'Regional Medical Center Addition',
        'Family Health Clinic',
        'Wellness Center',

        // Workplace
        'Tech Campus Building C',
        'Downtown Office Tower',
        'Corporate Headquarters Renovation',
        'Innovation Hub',
        'Sustainable Workplace Pilot',
    ];

    const projects: ProjectMetrics[] = [];

    projectNames.forEach((name, i) => {
        const sectorIndex = Math.floor(i / (projectNames.length / sectors.length));
        const sector = sectors[Math.min(sectorIndex, sectors.length - 1)];
        const phase = phases[Math.floor(Math.random() * phases.length)];
        const eligibilityStatus = eligibilityStatuses[Math.floor(Math.random() * 4)];

        // Generate realistic metrics
        const euiReduction = 0.5 + Math.random() * 0.4; // 50-90%
        const waterReduction = 0.3 + Math.random() * 0.5; // 30-80%

        projects.push({
            id: `demo-${140000 + i}`,
            name,
            sector,
            phase,
            archVsInt: Math.random() > 0.5 ? 'Architecture' : 'Interiors',
            isEligible: eligibilityStatus === 'Yes',
            eligibilityStatus,

            resilience: {
                euiReduction,
                meets2030Goal: euiReduction >= 0.80,
                operationalCarbonReduction: Math.random() > 0.3 ? Math.random() * 0.5 : null,
                embodiedCarbonPathway: ['TBD', 'Tracking', 'N/A'][Math.floor(Math.random() * 3)],
                indoorWaterReduction: waterReduction,
                meetsWaterGoal: waterReduction >= 0.40,
                ecologyScore: Math.floor(Math.random() * 5), // 0-4
                resilienceScore: Math.floor(Math.random() * 4), // 0-3
            },

            health: {
                switchListVetted: Math.random() > 0.3,
                airScore: Math.floor(Math.random() * 6), // 0-5
                lightScore: Math.floor(Math.random() * 6),
                thermalComfortScore: Math.floor(Math.random() * 6),
                acousticScore: Math.floor(Math.random() * 6),
                waterQualityScore: Math.floor(Math.random() * 6),
                biophiliaScore: Math.floor(Math.random() * 6),
            },
        });
    });

    return projects;
};
