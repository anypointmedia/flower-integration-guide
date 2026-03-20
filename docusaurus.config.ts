import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'FLOWER Integration Guide',
  tagline: 'Ad integration SDK documentation for Linear TV and OTT/FAST platforms',
  favicon: 'img/favicon.png',

  future: {
    v4: true,
  },

  url: 'https://anypointmedia.github.io',
  baseUrl: '/flower-integration-guide/',

  organizationName: 'anypointmedia',
  projectName: 'flower-integration-guide',

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    format: 'detect',
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/logo.png',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'FLOWER',
      logo: {
        alt: 'AnypointMedia Logo',
        src: 'img/logo.png',
      },
      items: [
        {
          to: '/docs',
          position: 'left',
          label: 'Integration Guide',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'FLOWER Integration Guide',
              to: '/docs',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} AnypointMedia, Inc.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['java', 'kotlin', 'swift', 'groovy', 'bash', 'typescript'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
