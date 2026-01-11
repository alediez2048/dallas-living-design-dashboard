import React from 'react';

interface LivingDesignFlowerProps {
    className?: string;
}

export const LivingDesignFlower: React.FC<LivingDesignFlowerProps> = ({ className = '' }) => {
    const petals = [
        { label: 'Poetics &\nBeauty', angle: 0 },
        { label: 'Conceptual\nClarity', angle: 51.4 },
        { label: 'Research &\nInnovation', angle: 102.8 },
        { label: 'Technology &\nTectonics', angle: 154.3 },
        { label: 'Community &\nInclusion', angle: 205.7 },
        { label: 'Resilience &\nRegeneration', angle: 257.1 },
        { label: 'Health &\nWell-Being', angle: 308.5 },
    ];

    const centerX = 200;
    const centerY = 200;

    return (
        <svg
            viewBox="0 0 400 400"
            className={`${className}`}
            style={{ maxWidth: '100%', height: 'auto' }}
        >
            <defs>
                {/* Gradient for outer petals */}
                <radialGradient id="petalGradientOuter" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#bbf7d0" />
                    <stop offset="100%" stopColor="#86efac" />
                </radialGradient>

                {/* Gradient for inner petals */}
                <radialGradient id="petalGradientInner" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#16a34a" />
                </radialGradient>

                {/* Gradient for center */}
                <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#f0fdf4" />
                </radialGradient>
            </defs>

            {/* Outer Petals (light green) */}
            {petals.map((petal, index) => (
                <ellipse
                    key={`outer-${index}`}
                    cx={centerX}
                    cy={centerY - 75}
                    rx={55}
                    ry={95}
                    fill="url(#petalGradientOuter)"
                    opacity="0.9"
                    transform={`rotate(${petal.angle}, ${centerX}, ${centerY})`}
                />
            ))}

            {/* Inner Petals (darker green) */}
            {petals.map((petal, index) => (
                <ellipse
                    key={`inner-${index}`}
                    cx={centerX}
                    cy={centerY - 45}
                    rx={30}
                    ry={60}
                    fill="url(#petalGradientInner)"
                    opacity="0.85"
                    transform={`rotate(${petal.angle}, ${centerX}, ${centerY})`}
                />
            ))}

            {/* Center circle - outer ring */}
            <circle
                cx={centerX}
                cy={centerY}
                r={38}
                fill="url(#centerGradient)"
                stroke="#22c55e"
                strokeWidth="2"
            />

            {/* Center circle - inner */}
            <circle
                cx={centerX}
                cy={centerY}
                r={32}
                fill="white"
            />

            {/* Center text */}
            <text
                x={centerX}
                y={centerY - 6}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-gray-800"
                style={{ fontSize: '12px', fontWeight: 700 }}
            >
                Living
            </text>
            <text
                x={centerX}
                y={centerY + 8}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-gray-800"
                style={{ fontSize: '12px', fontWeight: 700 }}
            >
                Design
            </text>

            {/* Petal Labels */}
            {petals.map((petal, index) => {
                const angleRad = ((petal.angle - 90) * Math.PI) / 180;
                const labelDistance = 120;
                const textX = centerX + Math.cos(angleRad) * labelDistance;
                const textY = centerY + Math.sin(angleRad) * labelDistance;
                const lines = petal.label.split('\n');

                return (
                    <text
                        key={`label-${index}`}
                        x={textX}
                        y={textY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-gray-700 dark:fill-gray-800"
                        style={{ fontSize: '10px', fontWeight: 600 }}
                    >
                        {lines.map((line, lineIndex) => (
                            <tspan
                                key={lineIndex}
                                x={textX}
                                dy={lineIndex === 0 ? `-${(lines.length - 1) * 5}px` : '11px'}
                            >
                                {line}
                            </tspan>
                        ))}
                    </text>
                );
            })}
        </svg>
    );
};
