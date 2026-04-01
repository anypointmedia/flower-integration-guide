import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Translate, {translate} from '@docusaurus/Translate';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

interface PlatformCard {
  id: string;
  title: string;
  icon: string;
  description: string;
  link: string;
}

const platformCards: ReadonlyArray<PlatformCard> = [
  {
    id: 'linearTv',
    title: translate({id: 'homepage.platform.linearTv.title', message: 'Linear TV'}),
    icon: '📺',
    description: translate({
      id: 'homepage.platform.linearTv.description',
      message: 'SCTE-35 signal-based ad insertion for traditional broadcast environments',
    }),
    link: '/docs/linear-tv/sdk-architecture',
  },
  {
    id: 'android',
    title: translate({id: 'homepage.platform.android.title', message: 'Android'}),
    icon: '📱',
    description: translate({
      id: 'homepage.platform.android.description',
      message: 'ExoPlayer & Media3 integration for OTT/FAST ad insertion on Android',
    }),
    link: '/docs/ott-fast/android/setting-up-dev-environment',
  },
  {
    id: 'ios',
    title: translate({id: 'homepage.platform.ios.title', message: 'iOS'}),
    icon: '🍎',
    description: translate({
      id: 'homepage.platform.ios.description',
      message: 'AVPlayer-based ad insertion for OTT/FAST on iOS and tvOS',
    }),
    link: '/docs/ott-fast/ios/setting-up-dev-environment',
  },
  {
    id: 'html5',
    title: translate({id: 'homepage.platform.html5.title', message: 'HTML5'}),
    icon: '🌐',
    description: translate({
      id: 'homepage.platform.html5.description',
      message: 'HLS.js-based ad insertion for web-based OTT/FAST players',
    }),
    link: '/docs/ott-fast/html5/setting-up-dev-environment',
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
      message: 'Single SDK architecture across Android, iOS, HTML5, and Linear TV with platform-native player integrations.',
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
          <Translate id="homepage.tagline" description="The homepage tagline">
            {siteConfig.tagline}
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

function PlatformCards() {
  return (
    <section className={styles.platforms}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          <Translate id="homepage.platforms.heading">
            Choose Your Platform
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
        <PlatformCards />
        <Features />
      </main>
    </Layout>
  );
}
