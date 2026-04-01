import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {createPortal} from 'react-dom';
import clsx from 'clsx';
import {useCodeBlockContext} from '@docusaurus/theme-common/internal';
import Button from '@theme/CodeBlock/Buttons/Button';

import styles from './styles.module.css';

interface ParamCondition {
  readonly paramName: string; // which parameter to check
  readonly value: string; // trigger value
  readonly negate: boolean; // true = hide when value matches, false = show when value matches
}

interface ParamInfo {
  readonly name: string;
  readonly hint: string;
  readonly options: readonly string[];
  readonly condition: ParamCondition | null;
}

const PARAM_PATTERN = /\{\{([^}]+)\}\}/g;

// How many lines after a placeholder to scan for Note conditions
const NOTE_LOOKAHEAD = 3;

function parseParameters(code: string): ParamInfo[] {
  const seen = new Set<string>();
  const parsed: Array<{
    name: string;
    hint: string;
    options: string[];
    condition: ParamCondition | null;
  }> = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matches = [...line.matchAll(PARAM_PATTERN)];
    for (const match of matches) {
      const name = match[1].trim();
      if (seen.has(name)) continue;
      seen.add(name);

      // Extract hint: text in parentheses after the placeholder on the same line
      const afterPlaceholder = line.slice(
        (match.index ?? 0) + match[0].length,
      );
      let hintMatch = afterPlaceholder.match(/\(([^)]+)\)/);

      // If not found on same line, check the next line
      if (!hintMatch && i + 1 < lines.length) {
        hintMatch = lines[i + 1].match(/^\s*\(([^)]+)\)/);
      }

      const hint = hintMatch ? hintMatch[1].trim() : '';

      const options =
        hint && hint.includes('|')
          ? hint.split('|').map((o) => o.trim()).filter(Boolean)
          : [];

      // Detect positive condition: "For X only" in hint
      let condition: ParamCondition | null = null;
      const positiveMatch = hint.match(/[Ff]or\s+(\S+)\s+only/);
      if (positiveMatch) {
        condition = {paramName: '', value: positiveMatch[1], negate: false};
      }

      // Detect negative condition from Note line after param declaration
      // Example: "Note: For interstitial AD_TYPE, no APPROACH selection is needed."
      if (!condition) {
        for (let j = i + 1; j < lines.length && j <= i + NOTE_LOOKAHEAD; j++) {
          const noteLine = lines[j];
          const negMatch = noteLine.match(
            /[Nn]ote:?\s+[Ff]or\s+(\w+)\s+(\w+),\s+no\s+(\w+)\s+selection/,
          );
          if (negMatch) {
            const [, triggerValue, triggerParam, targetParam] = negMatch;
            if (targetParam.toUpperCase() === name) {
              condition = {
                paramName: triggerParam.toUpperCase(),
                value: triggerValue,
                negate: true,
              };
              break;
            }
          }
        }
      }

      parsed.push({name, hint, options, condition});
    }
  }

  // Resolve unresolved conditions (positive ones with empty paramName)
  const optionParams = parsed.filter((p) => p.options.length > 0);
  const resolved: ParamInfo[] = parsed.map((param) => {
    if (!param.condition) return param;

    // Already resolved (from Note line parsing) — verify target exists
    if (param.condition.paramName) {
      const exists = parsed.some(
        (p) => p.name === param.condition!.paramName,
      );
      return exists ? param : {...param, condition: null};
    }

    // Find which option-parameter contains the condition value
    const condValue = param.condition.value.toLowerCase();
    for (const op of optionParams) {
      if (op.options.some((o) => o.toLowerCase() === condValue)) {
        return {
          ...param,
          condition: {...param.condition, paramName: op.name},
        };
      }
    }

    return {...param, condition: null};
  });

  return resolved;
}

function replaceParameters(
  code: string,
  values: Record<string, string>,
): string {
  return code.replace(PARAM_PATTERN, (_, paramName) => {
    const name = paramName.trim();
    return values[name] || `{{${name}}}`;
  });
}

function ParameterIcon(): ReactNode {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function ParameterModal({
  params,
  onCopy,
  onClose,
}: {
  params: ParamInfo[];
  onCopy: (values: Record<string, string>) => Promise<boolean>;
  onClose: () => void;
}): ReactNode {
  const [values, setValues] = useState<Record<string, string>>({});
  const [isCopied, setIsCopied] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const copyTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    firstInputRef.current?.focus();
    return () => window.clearTimeout(copyTimeoutRef.current);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const visibleParams = useMemo(
    () =>
      params.filter((p) => {
        if (!p.condition) return true;
        const selected = values[p.condition.paramName];
        // Before the controlling param is selected, show the field by default
        if (selected === undefined) return !p.condition.negate ? false : true;
        const matches =
          selected.toLowerCase() === p.condition.value.toLowerCase();
        return p.condition.negate ? !matches : matches;
      }),
    [params, values],
  );

  // Clear values for params that became hidden
  const hiddenNames = useMemo(() => {
    const visibleNames = new Set(visibleParams.map((p) => p.name));
    return params
      .filter((p) => !visibleNames.has(p.name))
      .map((p) => p.name);
  }, [params, visibleParams]);

  useEffect(() => {
    const staleKeys = hiddenNames.filter((name) => values[name] !== undefined);
    if (staleKeys.length === 0) return;
    setValues((prev) => {
      const next = {...prev};
      for (const key of staleKeys) {
        delete next[key];
      }
      return next;
    });
  }, [hiddenNames]); // eslint-disable-line react-hooks/exhaustive-deps

  const filledCount = visibleParams.filter((p) => values[p.name]?.trim()).length;

  const handleCopy = useCallback(async () => {
    const success = await onCopy(values);
    if (!success) return;
    setIsCopied(true);
    copyTimeoutRef.current = window.setTimeout(() => {
      setIsCopied(false);
    }, 1500);
  }, [values, onCopy]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (index < visibleParams.length - 1) {
          const nextInput = document.querySelector<HTMLInputElement>(
            `[data-param-index="${index + 1}"]`,
          );
          nextInput?.focus();
        } else {
          handleCopy();
        }
      }
    },
    [visibleParams, handleCopy],
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Fill Parameters</h3>
          <span className={styles.counter}>
            {filledCount} / {visibleParams.length}
          </span>
        </div>

        <div className={styles.body}>
          {visibleParams.map((param, i) => (
            <div key={param.name} className={styles.field}>
              <label className={styles.label}>{`{{${param.name}}}`}</label>
              {param.options.length > 0 ? (
                <div className={styles.radioGroup}>
                  {param.options.map((option) => (
                    <label key={option} className={styles.radioLabel}>
                      <input
                        type="radio"
                        name={param.name}
                        value={option}
                        checked={values[param.name] === option}
                        onChange={() =>
                          setValues((prev) => ({...prev, [param.name]: option}))
                        }
                        className={styles.radioInput}
                      />
                      <span className={styles.radioText}>{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  ref={i === 0 ? firstInputRef : undefined}
                  data-param-index={i}
                  className={styles.input}
                  placeholder={param.hint || `Enter ${param.name}`}
                  value={values[param.name] || ''}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [param.name]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => handleKeyDown(e, i)}
                />
              )}
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={clsx(styles.copyBtn, isCopied && styles.copied)}
            onClick={handleCopy}>
            {isCopied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <span className={styles.hint}>
            Empty fields keep {'{{placeholder}}'} as-is
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ParameterCopyButton({
  className,
}: {
  className?: string;
}): ReactNode {
  const {
    metadata: {code},
  } = useCodeBlockContext();
  const [isOpen, setIsOpen] = useState(false);

  const params = useMemo(() => parseParameters(code), [code]);

  const handleCopy = useCallback(
    async (values: Record<string, string>): Promise<boolean> => {
      const result = replaceParameters(code, values);
      try {
        await navigator.clipboard.writeText(result);
        return true;
      } catch {
        console.error('Failed to copy to clipboard');
        return false;
      }
    },
    [code],
  );

  if (params.length === 0) return null;

  return (
    <>
      <Button
        aria-label="Copy with parameters"
        title="Copy with parameters"
        className={clsx(className, styles.paramButton)}
        onClick={() => setIsOpen(true)}>
        <ParameterIcon />
      </Button>
      {isOpen &&
        createPortal(
          <ParameterModal
            params={params}
            onCopy={handleCopy}
            onClose={() => setIsOpen(false)}
          />,
          document.body,
        )}
    </>
  );
}
