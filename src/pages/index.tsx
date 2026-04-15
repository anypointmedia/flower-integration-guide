import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Translate, {translate} from '@docusaurus/Translate';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

interface PlatformLink {
  platform: string;
  link: string;
}

interface ContentTypeItem {
  id: string;
  title: string;
  platformLinks: ReadonlyArray<PlatformLink>;
}

interface ContentTypeGroup {
  id: string;
  title: string;
  items: ReadonlyArray<ContentTypeItem>;
}

const contentTypeGroups: ReadonlyArray<ContentTypeGroup> = [
  {
    id: 'linearTv',
    title: translate({id: 'homepage.contentType.linearTv.title', message: 'Linear TV (incl. FAST)'}),
    items: [
      {
        id: 'unicast',
        title: translate({id: 'homepage.contentType.unicast.title', message: 'Unicast (HLS / DASH)'}),
        platformLinks: [
          {platform: 'Android', link: '/docs/android-linear-tv-fast'},
          {platform: 'iOS', link: '/docs/ios-linear-tv-fast'},
          {platform: 'Web / Smart TV', link: '/docs/web-linear-tv-fast'},
        ],
      },
      {
        id: 'satellite',
        title: translate({id: 'homepage.contentType.satellite.title', message: 'Satellite / Multicast (DTH / IPTV)'}),
        platformLinks: [
          {platform: 'Android', link: '/docs/category/satelliteiptv'},
        ],
      },
    ],
  },
  {
    id: 'vod',
    title: translate({id: 'homepage.contentType.vod.title', message: 'VOD (Video On Demand)'}),
    items: [
      {
        id: 'vodAd',
        title: '',
        platformLinks: [
          {platform: 'Android', link: '/docs/android-vod'},
          {platform: 'iOS', link: '/docs/ios-vod'},
          {platform: 'Web / Smart TV', link: '/docs/web-vod'},
        ],
      },
    ],
  },
  {
    id: 'advancedAd',
    title: translate({id: 'homepage.contentType.advancedAd.title', message: 'Advanced Ad Formats'}),
    items: [
      {
        id: 'advancedAdFormats',
        title: '',
        platformLinks: [
          {platform: 'Android', link: '/docs/android-advanced-ad-formats'},
          {platform: 'iOS', link: '/docs/ios-advanced-ad-formats'},
          {platform: 'Web / Smart TV', link: '/docs/web-advanced-ad-formats'},
        ],
      },
    ],
  },
];

interface PlatformCard {
  id: string;
  title: string;
  icon: ReactNode;
  description: string;
  link: string;
}

const AppleLogo = () => (
  <svg viewBox="0 0 384 512" width="40" height="40" fill="currentColor">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
  </svg>
);

const AndroidLogo = () => (
  <svg viewBox="0 0 24 28" width="40" height="46" fill="#3DDC84">
    <path d="M6.725 3.28l-1.6-2.76a.32.32 0 01.12-.44.33.33 0 01.44.12l1.62 2.8A9.04 9.04 0 0112 2.04c1.73 0 3.33.48 4.7 1.28l1.62-2.81a.33.33 0 01.44-.12.32.32 0 01.12.44l-1.6 2.76C20.1 5.2 22 8.36 22 12H2c0-3.64 1.9-6.8 4.725-8.72zM8.5 8.5a1 1 0 100 2 1 1 0 000-2zm7 0a1 1 0 100 2 1 1 0 000-2zM5 13.5v8a1.5 1.5 0 001.5 1.5H8v2.5a1.5 1.5 0 103 0V23h2v2.5a1.5 1.5 0 103 0V23h1.5a1.5 1.5 0 001.5-1.5v-8H5zm-2.5 0A1.5 1.5 0 001 15v6a1.5 1.5 0 103 0v-6a1.5 1.5 0 00-1.5-1.5zm19 0A1.5 1.5 0 0020 15v6a1.5 1.5 0 103 0v-6a1.5 1.5 0 00-1.5-1.5z" />
  </svg>
);

const WebTvLogo = () => (
  <svg viewBox="0 0 640 512" width="40" height="40" fill="currentColor">
    <path d="M64 96c0-17.7 14.3-32 32-32h448c17.7 0 32 14.3 32 32v256c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V96zM0 96c0-53 43-96 96-96h448c53 0 96 43 96 96v256c0 53-43 96-96 96H96c-53 0-96-43-96-96V96zm160 416h320c8.8 0 16 7.2 16 16s-7.2 16-16 16H160c-8.8 0-16-7.2-16-16s7.2-16 16-16z" />
  </svg>
);

const platformCards: ReadonlyArray<PlatformCard> = [
  {
    id: 'android',
    title: translate({id: 'homepage.platform.android.title', message: 'Android'}),
    icon: <AndroidLogo />,
    description: '',
    link: '/docs/category/android',
  },
  {
    id: 'ios',
    title: translate({id: 'homepage.platform.ios.title', message: 'iOS'}),
    icon: <AppleLogo />,
    description: '',
    link: '/docs/category/ios',
  },
  {
    id: 'webSmartTv',
    title: translate({id: 'homepage.platform.webSmartTv.title', message: 'Web / Smart TV'}),
    icon: <WebTvLogo />,
    description: '',
    link: '/docs/category/web--smart-tv',
  },
];

interface FeatureItem {
  title: string;
  description: string;
}

const features: ReadonlyArray<FeatureItem> = [
  {
    title: translate({id: 'homepage.feature.cspm.title', message: 'Client-Side Playlist Manipulation'}),
    description: translate({
      id: 'homepage.feature.cspm.description',
      message: 'The viewer\'s device directly manipulates the playlist in coordination with the FLOWER ad server — enabling skip, overlay, and interactive ads with no SSAI infrastructure costs.',
    }),
  },
  {
    title: translate({id: 'homepage.feature.multiPlatform.title', message: 'Multi-Platform Support'}),
    description: translate({
      id: 'homepage.feature.multiPlatform.description',
      message: 'Single SDK architecture across Android, iOS, and Web/Smart TV with platform-native player integrations.',
    }),
  },
  {
    title: translate({id: 'homepage.feature.prompts.title', message: 'AI-Assisted Integration'}),
    description: translate({
      id: 'homepage.feature.prompts.description',
      message: 'Step-by-step prompt guides to integrate the FLOWER SDK with AI coding assistants for faster onboarding.',
    }),
  },
];

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          <Translate id="homepage.title" description="The homepage title">
            {siteConfig.title}
          </Translate>
        </Heading>
        <p className="hero__subtitle">
          <Translate id="homepage.heroDescription" description="The homepage hero description about FLOWER platform">
            Anypoint Media's FLOWER platform empowers the world's leading media operators to recapture lost ad revenue, unlock new premium formats, and radically reduce operational costs.
          </Translate>
        </p>
        <p className="hero__subtitle" style={{fontSize: '1rem', opacity: 0.9}}>
          <Translate id="homepage.heroSubDescription" description="The homepage hero sub-description about integration guide">
            This guide provides step-by-step instructions for integrating with the FLOWER system across various platforms and environments.
          </Translate>
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs">
            <Translate id="homepage.getStarted" description="The homepage get started button label">
              Get Started
            </Translate>
          </Link>
        </div>
      </div>
    </header>
  );
}

function ContentTypeSection() {
  return (
    <section className={styles.platforms}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          <Translate id="homepage.contentType.heading">
            By Content Type
          </Translate>
        </Heading>
        {contentTypeGroups.map((group) => (
          <div key={group.id} className={styles.contentTypeGroup}>
            <Heading as="h3" className={styles.contentTypeGroupTitle}>{group.title}</Heading>
            {group.items.map((item) => (
              <div key={item.id} className={styles.contentTypeItem}>
                {item.title && <Heading as="h4" className={styles.contentTypeItemTitle}>{item.title}</Heading>}
                <div className={styles.platformLinkGrid}>
                  {item.platformLinks.map((pl) => (
                    <Link key={pl.platform} to={pl.link} className={styles.platformLinkCard}>
                      <span className={styles.platformLinkPlatform}>{pl.platform}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function PlatformSection() {
  return (
    <section className={styles.platforms} style={{paddingTop: 0}}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          <Translate id="homepage.platforms.heading">
            By Platform
          </Translate>
        </Heading>
        <div className={styles.platformGrid}>
          {platformCards.map((card) => (
            <Link key={card.id} to={card.link} className={styles.platformCard}>
              <div className={styles.platformIcon}>{card.icon}</div>
              <Heading as="h3">{card.title}</Heading>
              <p>{card.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {features.map((feature, index) => (
            <div key={index} className={clsx('col col--4')}>
              <div className={styles.featureItem}>
                <Heading as="h3">{feature.title}</Heading>
                <p>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description={siteConfig.tagline}>
      <HomepageHeader />
      <main>
        <ContentTypeSection />
        <PlatformSection />
        <Features />
      </main>
    </Layout>
  );
}
