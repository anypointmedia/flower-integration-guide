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
  icon: string;
  description: string;
  link: string;
}

const platformCards: ReadonlyArray<PlatformCard> = [
  {
    id: 'android',
    title: translate({id: 'homepage.platform.android.title', message: 'Android'}),
    icon: '📱',
    description: '',
    link: '/docs/category/android',
  },
  {
    id: 'ios',
    title: translate({id: 'homepage.platform.ios.title', message: 'iOS'}),
    icon: '🍎',
    description: '',
    link: '/docs/category/ios',
  },
  {
    id: 'webSmartTv',
    title: translate({id: 'homepage.platform.webSmartTv.title', message: 'Web / Smart TV'}),
    icon: '🌐',
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
