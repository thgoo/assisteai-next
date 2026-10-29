'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { Category, TitleResult } from '@/lib/types';
import classes from './style.module.scss';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;
// A pasted IMDb/TMDb link goes straight to the API, no search
const LINK_PATTERN = /^https?:\/\/|imdb\.com|themoviedb\.org/i;

const CATEGORY_NAMES: Record<Category, string> = {
  movie: 'Filme',
  series: 'Série',
};

interface Search {
  term: string;
  status: 'done' | 'error';
  results: TitleResult[];
}

interface TitleFieldProps {
  id: string;
  /** The form field holding the title's link, for `POST /ratings` */
  name: string;
}

/** Search a title by name (TMDb, through the API) or paste its IMDb/TMDb link. */
const TitleField = ({ id, name }: TitleFieldProps) => {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<TitleResult | null>(null);
  const [search, setSearch] = useState<Search | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  // Esc closes the list, not the modal, which closes on the keyup
  const escapeClosedList = useRef(false);
  // The input only exists again once the picked title is cleared, so it's focused after that render
  const focusAfterClear = useRef(false);

  const isLink = LINK_PATTERN.test(query.trim());
  const term = selected || isLink ? '' : query.trim();
  const canSearch = term.length >= MIN_QUERY_LENGTH;
  // Results of an older term are never shown
  const current = search?.term === term ? search : null;
  const results = current?.results ?? [];

  useEffect(() => {
    if (!canSearch) return undefined;

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const { data } = await apiFetch<{ data: TitleResult[] }>(
          `/titles/search?q=${encodeURIComponent(term)}`,
          { signal: controller.signal },
        );
        setSearch({ term, status: 'done', results: data });
        setActiveIndex(-1);
      } catch {
        if (!controller.signal.aborted) setSearch({ term, status: 'error', results: [] });
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [term, canSearch]);

  const select = (title: TitleResult) => {
    if (title.ratedByMe) return;
    setSelected(title);
    setIsOpen(false);
  };

  const clear = () => {
    setSelected(null);
    setQuery('');
    setActiveIndex(-1);
    focusAfterClear.current = true;
  };

  useEffect(() => {
    if (selected || !focusAfterClear.current) return;
    focusAfterClear.current = false;
    inputRef.current?.focus();
  }, [selected]);

  // Skips titles already rated, which can't be picked
  const moveActive = (step: 1 | -1) => {
    for (let i = 1; i <= results.length; i++) {
      const next = (activeIndex + step * i + results.length) % results.length;
      if (!results[next].ratedByMe) {
        setActiveIndex(next);
        return;
      }
    }
  };

  const onKeyDown = (evt: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || !results.length) {
      if (evt.key === 'ArrowDown' && canSearch) setIsOpen(true);
      return;
    }

    if (evt.key === 'ArrowDown' || evt.key === 'ArrowUp') {
      evt.preventDefault();
      moveActive(evt.key === 'ArrowDown' ? 1 : -1);
    } else if (evt.key === 'Enter' && activeIndex >= 0) {
      // Picks the title instead of submitting the form
      evt.preventDefault();
      select(results[activeIndex]);
    } else if (evt.key === 'Escape') {
      escapeClosedList.current = true;
      setIsOpen(false);
    }
  };

  const onKeyUp = (evt: React.KeyboardEvent<HTMLInputElement>) => {
    if (evt.key === 'Escape' && escapeClosedList.current) {
      escapeClosedList.current = false;
      evt.stopPropagation();
    }
  };

  const link = selected?.url ?? (isLink ? query.trim() : '');
  const showList = isOpen && canSearch;

  return (
    <div className={classes.titleField}>
      <input type="hidden" name={name} value={link} />
      {selected ? (
        <div className={classes.selected}>
          <Poster title={selected} />
          <div className={classes.titleText}>
            <span className={classes.titleName}>{selected.title}</span>
            <span className={classes.titleMeta}>{describe(selected)}</span>
          </div>
          <button type="button" className={classes.clear} onClick={clear} aria-label="Trocar título">
            <X />
          </button>
        </div>
      ) : (
        <input
          ref={inputRef}
          type="text"
          id={id}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          autoComplete="off"
          placeholder="Digite o nome ou cole o link do IMDb/TMDb..."
          value={query}
          onChange={(evt) => {
            setQuery(evt.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
        />
      )}
      {showList ? (
        // Clicks don't take the focus away from the input, which would close the list first
        <ul id={listId} role="listbox" className={classes.list} onMouseDown={evt => evt.preventDefault()}>
          {!current ? <li className={classes.status}>Buscando...</li> : null}
          {current?.status === 'error' ? <li className={classes.status}>Não foi possível buscar agora.</li> : null}
          {current?.status === 'done' && !results.length ? (
            <li className={classes.status}>Nenhum título encontrado.</li>
          ) : null}
          {results.map((title, i) => (
            <li
              key={title.url}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              aria-disabled={title.ratedByMe}
              className={`${classes.option} ${i === activeIndex ? classes.isActive : ''}`}
              onClick={() => select(title)}
            >
              <Poster title={title} />
              <div className={classes.titleText}>
                <span className={classes.titleName}>{title.title}</span>
                <span className={classes.titleMeta}>
                  {describe(title)}
                  {title.ratedByMe ? <strong> · Você já avaliou</strong> : null}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

/** "Filme · 1999 · The Matrix" (the original title only when it differs) */
const describe = (title: TitleResult) => [
  CATEGORY_NAMES[title.category],
  title.year,
  title.originalTitle !== title.title ? title.originalTitle : null,
].filter(Boolean).join(' · ');

const Poster = ({ title }: { title: TitleResult }) => (
  title.posterUrl
    ? <Image src={title.posterUrl} alt="" width={34} height={51} className={classes.poster} />
    : <div className={classes.poster} />
);

export default TitleField;
