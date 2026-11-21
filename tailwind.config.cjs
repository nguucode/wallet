/** @type {import('tailwindcss').Config} */
module.exports = {
  // Class, not media: the viewer can force Light or Dark (src/app/theme.ts); gluestack's script sets the class.
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  // `mac:` = the web layout (useLayout's 1024px breakpoint), which renders the macOS System Settings grammar.
  plugins: [require('tailwindcss/plugin')(({ addVariant }) => addVariant('mac', '@media (min-width: 1024px)'))],
  important: 'html',
  safelist: [
    {
      pattern:
        /(bg|border|text|stroke|fill)-(foreground|card|popover|muted|destructive|border|input|ring|white|chart|sidebar|primary|secondary|typography|background|accent)(\/\d+)?$/,
    },
    {
      pattern:
        /(bg|border|text|stroke|fill)-(card|popover|muted|destructive|primary|secondary|accent|sidebar)-(foreground)(\/\d+)?$/,
    },
  ],
  theme: {
    extend: {
      colors: {
        foreground: 'rgb(var(--foreground)/<alpha-value>)',
        // Page behind the content panel (web) / behind cards (app); value set by src/app/theme.ts.
        backdrop: {
          DEFAULT: 'rgb(var(--backdrop, 229 229 234) / <alpha-value>)',
          tint: 'rgb(var(--backdrop-tint, 229 229 234) / <alpha-value>)',
          app: 'rgb(var(--backdrop-app, 242 242 247) / <alpha-value>)',
          'app-tint': 'rgb(var(--backdrop-app-tint, 242 242 247) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--success) / <alpha-value>)',
          foreground: 'rgb(var(--success-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(var(--popover) / <alpha-value>)',
          foreground: 'rgb(var(--popover-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
        },
        border: 'rgb(var(--border)/<alpha-value>)',
        // Web (macOS) only: selected segment and the sidebar panel, defined in app/globals.css.
        'segment-selected': 'rgb(var(--segment-selected, 210 210 210) / <alpha-value>)',
        input: 'rgb(var(--input)/<alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
        white: 'rgb(255 255 255)',
        // Chart colors
        chart: {
          1: 'rgb(var(--chart-1) / <alpha-value>)',
          2: 'rgb(var(--chart-2) / <alpha-value>)',
          3: 'rgb(var(--chart-3) / <alpha-value>)',
          4: 'rgb(var(--chart-4) / <alpha-value>)',
          5: 'rgb(var(--chart-5) / <alpha-value>)',
        },

        // Sidebar colors
        sidebar: {
          'DEFAULT': 'rgb(var(--sidebar) / <alpha-value>)',
          'foreground': 'rgb(var(--sidebar-foreground) / <alpha-value>)',
          'primary': 'rgb(var(--sidebar-primary) / <alpha-value>)',
          'primary-foreground':
            'rgb(var(--sidebar-primary-foreground) / <alpha-value>)',
          'accent': 'rgb(var(--sidebar-accent) / <alpha-value>)',
          'accent-foreground':
            'rgb(var(--sidebar-accent-foreground) / <alpha-value>)',
          'border': 'rgb(var(--sidebar-border))',
          'ring': 'rgb(var(--sidebar-ring) / <alpha-value>)',
        },

        primary: {
          DEFAULT: 'rgb(var(--primary)/<alpha-value>)',
          foreground: 'rgb(var(--primary-foreground)/<alpha-value>)',
        },

        secondary: {
          DEFAULT: 'rgb(var(--secondary)/<alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground)/<alpha-value>)',
        },

        typography: {
          white: '#FFFFFF',
          gray: '#D4D4D4',
          black: '#181718',
        },

        background: {
          DEFAULT: 'rgb(var(--background)/<alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent)/<alpha-value>)',
          foreground: 'rgb(var(--accent-foreground)/<alpha-value>)',
        },
      },
      fontFamily: {
        // iOS 27 revamp: SF Pro through the system stack on Apple devices; Inter (next/font, Vietnamese) elsewhere.
        heading: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'var(--font-sans)', 'system-ui', 'sans-serif'],
        body: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: 'var(--font-mono)',
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: 'var(--font-serif)',
        inter: ['var(--font-inter)'],
        georgia: ['Georgia'],
        melno: ['Melno'],
        andika: [
          'Andika_400Regular',
          'Andika_400Regular_Italic',
          'Andika_700Bold',
          'Andika_700Bold_Italic',
        ],
        outfit: [
          'Outfit_400Regular',
          'Outfit_500Medium',
          'Outfit_600SemiBold',
          'Outfit_700Bold',
          'Outfit_800ExtraBold',
          'Outfit_900Black',
        ],
      },
      // Focus rings use the token (AppKit keyboardFocusIndicatorColor on web), not Tailwind's default blue.
      ringColor: { DEFAULT: 'rgb(var(--ring) / 0.5)' },
      fontWeight: {
        extrablack: '950',
      },
      // iOS Dynamic Type default sizes on the Tailwind scale gluestack's Text/Heading sizes resolve to:
      // xs Footnote 13 · sm Subheadline 15 · base Body/Headline 17 · lg Title 3 20 · xl Title 2 22 · 2xl Title 1 28 ·
      // 3xl 30 · 4xl Large Title 34 (Heading 3xl, page titles, amounts) · 5xl 48 (balance).
      // Type scale as variables: iOS Dynamic Type by default (app layout); the web layout (app/globals.css, >= 1024px) re-values them to the
      // AppKit text styles read from NSFont.preferredFont on macOS 26 (see app/globals.css and DESIGN.md).
      // iOS: xs Footnote 13 · sm Subheadline 15 · base Body 17 · lg Title 3 20 · xl Title 2 22 · 2xl Title 1 28 ·
      // 4xl Large Title 34 · 5xl 48 (balance).
      fontSize: {
        '2xs': '10px',
        xs: ['var(--fs-xs, 13px)', 'var(--lh-xs, 18px)'],
        sm: ['var(--fs-sm, 15px)', 'var(--lh-sm, 20px)'],
        base: ['var(--fs-base, 17px)', 'var(--lh-base, 23px)'], // iOS Body is 17/22; 23 gives Vietnamese diacritics room
        lg: ['var(--fs-lg, 20px)', 'var(--lh-lg, 25px)'],
        xl: ['var(--fs-xl, 22px)', 'var(--lh-xl, 28px)'],
        '2xl': ['var(--fs-2xl, 28px)', 'var(--lh-2xl, 34px)'],
        '3xl': ['var(--fs-3xl, 30px)', 'var(--lh-3xl, 36px)'],
        '4xl': ['var(--fs-4xl, 34px)', 'var(--lh-4xl, 41px)'],
        '5xl': ['var(--fs-5xl, 48px)', 'var(--lh-5xl, 52px)'],
      },
      boxShadow: {
        'hard-1': '-2px 2px 8px 0px rgba(38, 38, 38, 0.20)',
        'hard-2': '0px 3px 10px 0px rgba(38, 38, 38, 0.20)',
        'hard-3': '2px 2px 8px 0px rgba(38, 38, 38, 0.20)',
        'hard-4': '0px -3px 10px 0px rgba(38, 38, 38, 0.20)',
        'hard-5': '0px 2px 10px 0px rgba(38, 38, 38, 0.10)',
        'soft-1': '0px 0px 10px rgba(38, 38, 38, 0.1)',
        'soft-2': '0px 0px 20px rgba(38, 38, 38, 0.2)',
        'soft-3': '0px 0px 30px rgba(38, 38, 38, 0.1)',
        'soft-4': '0px 0px 40px rgba(38, 38, 38, 0.1)',
      },
    },
  },
};
