/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,ts}",
    ],
    theme: {
        extend: {
            colors: {
                'accent': '#3b6ff5',
                'accent-bright': '#4f7fff',
                'accent-red': '#ef4444',
                'accent-green': '#22c55e',
                'accent-purple': '#8b5cf6',
                'accent-yellow': '#f59e0b',
                'bg-main': '#060d1f',
                'bg-card': 'rgba(255,255,255,0.05)',
                'bg-sidebar': 'rgba(8,16,40,0.95)',
                'bg-panel': 'rgba(255,255,255,0.04)',
                'border-col': 'rgba(255,255,255,0.08)',
                'border-lt': 'rgba(255,255,255,0.12)',
                'txt': '#e8edf8',
                'txt-sec': 'rgba(200,215,240,0.6)',
                'txt-muted': 'rgba(200,215,240,0.35)',
            },
            fontFamily: {
                'syne': ['Syne', 'sans-serif'],
                'dmsans': ['DM Sans', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
