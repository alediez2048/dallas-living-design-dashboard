/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // ── Perkins & Will Brand Palette ───────────────────────────
                // Blue scale  →  P&W Navy / Royal Blue
                blue: {
                    50:  '#e8eaf3',
                    100: '#c6d6e3',
                    200: '#9baed4',
                    300: '#6d86c4',
                    400: '#5576d1',   // P&W light blue  #5576D1
                    500: '#1818a5',   // P&W medium blue  #1818A5
                    600: '#001e62',   // P&W navy (primary)  #001e62
                    700: '#001550',
                    800: '#000d38',
                    900: '#00061f',
                },
                // Indigo → same as blue for consistency with indigo- classes
                indigo: {
                    50:  '#eeeaf8',
                    100: '#d2c6e6',
                    200: '#b09fd4',
                    300: '#8d78c1',
                    400: '#9063cd',   // P&W light purple  #9063CD
                    500: '#6638bd',   // P&W medium purple  #6638BD
                    600: '#440099',   // P&W dark purple  #440099
                    700: '#340077',
                    800: '#240055',
                    900: '#140033',
                },
                // Teal scale  →  P&W Teal / Forest Green
                teal: {
                    50:  '#e0f4ef',
                    100: '#bde9c9',   // P&W pale teal  #BDE9C9
                    200: '#71cc98',   // P&W light teal  #71CC98
                    300: '#3ab880',
                    400: '#009b77',   // P&W medium teal  #009B77
                    500: '#007a5f',
                    600: '#285c4d',   // P&W dark teal  #285C4D
                    700: '#1e4439',
                    800: '#142d26',
                    900: '#0a1713',
                },
                // Green  →  reuse teal greens for consistency
                green: {
                    50:  '#e0f4ef',
                    100: '#bde9c9',
                    200: '#71cc98',
                    300: '#3ab880',
                    400: '#009b77',
                    500: '#007a5f',
                    600: '#285c4d',
                    700: '#1e4439',
                    800: '#142d26',
                    900: '#0a1713',
                },
                // Emerald → lighter teal tones
                emerald: {
                    50:  '#e0f4ef',
                    100: '#bde9c9',
                    200: '#71cc98',
                    300: '#3ab880',
                    400: '#009b77',
                    500: '#007a5f',
                    600: '#285c4d',
                    700: '#1e4439',
                    800: '#142d26',
                    900: '#0a1713',
                },
                // Purple scale  →  P&W Violet / Purple
                purple: {
                    50:  '#f2eafa',
                    100: '#d2c6e6',
                    200: '#b09fd4',
                    300: '#9063cd',   // P&W light purple  #9063CD
                    400: '#6638bd',   // P&W medium purple  #6638BD
                    500: '#440099',   // P&W dark purple  #440099
                    600: '#370080',
                    700: '#2a0060',
                    800: '#1c0040',
                    900: '#0e0020',
                },
                // Red / Coral  →  P&W Coral Red
                red: {
                    50:  '#fdecea',
                    100: '#faccc5',
                    200: '#f5aa9d',
                    300: '#f26344',   // P&W light coral  #F26344
                    400: '#e85030',
                    500: '#dd4832',   // P&W dark coral  #DD4832
                    600: '#c03d28',
                    700: '#9a301f',
                    800: '#742416',
                    900: '#4e180e',
                },
                // Orange / Amber  →  P&W Amber
                orange: {
                    50:  '#fff8e6',
                    100: '#f9cc83',   // P&W pale amber  #F9CC83
                    200: '#ffbe40',
                    300: '#ffb020',
                    400: '#ffa900',   // P&W amber  #FFA900
                    500: '#e09700',
                    600: '#c08200',
                    700: '#9a6800',
                    800: '#744e00',
                    900: '#4e3400',
                },
                // Yellow  →  P&W Amber tones
                yellow: {
                    50:  '#fefce8',
                    100: '#e9ec6b',   // P&W yellow-green  #E9EC6B
                    200: '#ffdb40',
                    300: '#ffc820',
                    400: '#ffa900',
                    500: '#e09700',
                    600: '#c08200',
                    700: '#9a6800',
                    800: '#744e00',
                    900: '#4e3400',
                },
                // Lime  →  P&W yellow-lime
                lime: {
                    50:  '#fafce8',
                    100: '#f4f7b0',
                    200: '#e9ec6b',   // P&W yellow-green  #E9EC6B
                    300: '#d4da3a',
                    400: '#bfc820',
                    500: '#a0aa10',
                    600: '#808800',
                    700: '#606600',
                    800: '#404400',
                    900: '#202200',
                },
                // Cyan  →  lighter teal tones
                cyan: {
                    50:  '#e0f4ef',
                    100: '#bde9c9',
                    200: '#71cc98',
                    300: '#3ab880',
                    400: '#009b77',
                    500: '#007a5f',
                    600: '#285c4d',
                    700: '#1e4439',
                    800: '#142d26',
                    900: '#0a1713',
                },
                // Violet  →  P&W Magenta / Violet
                violet: {
                    50:  '#f9eaf6',
                    100: '#f7b8ca',
                    200: '#e17fd2',   // P&W light magenta  #E17FD2
                    300: '#c040b0',
                    400: '#ab008b',   // P&W magenta  #AB008B
                    500: '#7d0061',   // P&W dark magenta  #7D0061
                    600: '#650050',
                    700: '#4d003c',
                    800: '#350028',
                    900: '#1c0014',
                },
                // Pink  →  P&W Magenta tones
                pink: {
                    50:  '#f9eaf6',
                    100: '#f7b8ca',
                    200: '#e17fd2',
                    300: '#c040b0',
                    400: '#ab008b',
                    500: '#7d0061',
                    600: '#650050',
                    700: '#4d003c',
                    800: '#350028',
                    900: '#1c0014',
                },

                // ── P&W Named Tokens (use these for semantic color references) ──
                'pw-navy':     '#001e62',
                'pw-blue':     '#1818a5',
                'pw-blue-lt':  '#5576d1',
                'pw-teal':     '#285c4d',
                'pw-teal-md':  '#009b77',
                'pw-teal-lt':  '#71cc98',
                'pw-purple':   '#440099',
                'pw-purple-md':'#6638bd',
                'pw-purple-lt':'#9063cd',
                'pw-magenta':  '#7d0061',
                'pw-magenta-md':'#ab008b',
                'pw-coral':    '#dd4832',
                'pw-coral-lt': '#f26344',
                'pw-amber':    '#ffa900',
            },
        },
    },
    plugins: [],
}
