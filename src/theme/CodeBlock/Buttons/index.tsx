import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import BrowserOnly from '@docusaurus/BrowserOnly';
import {useCodeBlockContext} from '@docusaurus/theme-common/internal';

import CopyButton from '@theme/CodeBlock/Buttons/CopyButton';
import type {Props} from '@theme/CodeBlock/Buttons';
import ParameterCopyButton from './ParameterCopyButton';

import styles from './styles.module.css';

function hasParameters(code: string): boolean {
  return /\{\{([^}]+)\}\}/.test(code);
}

function ButtonsContent({className}: Props): ReactNode {
  const {
    metadata: {code},
  } = useCodeBlockContext();

  const showParamButton = hasParameters(code);

  return (
    <div className={clsx(className, styles.buttonGroup)}>
      {showParamButton && <ParameterCopyButton />}
      <CopyButton />
    </div>
  );
}

export default function CodeBlockButtons({className}: Props): ReactNode {
  return (
    <BrowserOnly>{() => <ButtonsContent className={className} />}</BrowserOnly>
  );
}
