import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'FLOWER Integration Guide',
  tagline:
    'Ad integration SDK documentation for Android, Satellite/IPTV, Web/Smart TV, and iOS platforms',
  favicon: 'img/favicon.png',

  future: {
    v4: true,
  },

  url: 'https://flower-docs.anypoint.tv',
  baseUrl: '/',

  organizationName: 'anypointmedia',
  projectName: 'flower-integration-guide',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ko'],
    localeConfigs: {
      en: { label: 'English' },
      ko: { label: '한국어' },
    },
  },

  markdown: {
    format: 'detect',
    mermaid: true,
    mdx1Compat: {
      admonitions: true,
    },
  },

  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          admonitions: true,
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
        {
          href: 'https://forms.gle/8wkA8eFiBQQCSNWi8',
          label: 'Book a Demo',
          position: 'right',
        },
        {
          href: 'mailto:global@anypointmedia.com',
          label: 'Contact Sales',
          position: 'right',
        },
        {
          type: 'localeDropdown',
          position: 'right',
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
