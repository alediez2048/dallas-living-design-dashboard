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
                // We can add custom colors here later as per PRD "Sleek dark mode/light mode themes"
            },
        },
    },
    plugins: [],
}
