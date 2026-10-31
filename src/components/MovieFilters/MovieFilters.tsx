'use client';

import {
  useCallback, useEffect, useId, useRef, useState, useSyncExternalStore,
} from 'react';
import useSWR from 'swr';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import {
  countActiveFilters, DEFAULT_FILTERS, type MovieFilters as Filters, type MovieSort,
} from '@/lib/filters';
import { genreLabel } from '@/lib/genres';
import { RATING_LABELS } from '@/lib/ratings';
import type {
  Category, GenreCount, PublicUser, RatingKey,
} from '@/lib/types';
import useAuth from '../Auth/AuthProvider';
import useMovieFilters, { FILTERS_ELEMENT_ID } from './useMovieFilters';
import classes from './style.module.scss';

const SEARCH_DEBOUNCE_MS = 300;

const CATEGORIES: { value: Category | null; label: string }[] = [
  { value: null, label: 'Todos' },
  { value: 'movie', label: 'Filmes' },
  { value: 'series', label: 'Séries' },
];

// Best first
const RATING_ORDER = Object.keys(RATING_LABELS) as RatingKey[];

const noSubscription = () => () => {};

const SORTS: { value: MovieSort; label: string }[] = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'rating', label: 'Melhor média' },
  { value: 'popular', label: 'Mais avaliados' },
];

/** Search, filters and sort for the movie list, kept in the URL (useMovieFilters). */
const MovieFilters = () => {
  const { filters: urlFilters, setFilters } = useMovieFilters();
  const { isAuthenticated, loading: isCheckingSession } = useAuth();
  const { data: genres, isLoading: isLoadingGenres } = useSWR<{ data: GenreCount[] }>('/genres');
  const { data: users, isLoading: isLoadingUsers } = useSWR<{ data: PublicUser[] }>('/users');
  // The page is prerendered without filters; the URL's apply once hydrated
  const isHydrated = useSyncExternalStore(noSubscription, () => true, () => false);
  // Shown as they are once everything they need has arrived (the URL's filters, the genres' and people's names, the
  // session for "Só os que não avaliei"); the defaults until then, so the bar changes once rather than piece by piece
  const isReady = isHydrated && !isLoadingGenres && !isLoadingUsers && !isCheckingSession;
  const filters = isReady ? urlFilters : DEFAULT_FILTERS;
  // On phones the filters fold behind a button
  const [isOpen, setIsOpen] = useState(false);
  const activeCount = countActiveFilters(filters);

  const set = (change: Partial<Filters>) => setFilters(change);
  const search = useCallback((q: string) => setFilters({ q }, { replace: true }), [setFilters]);

  // Not a filter: next to the search on wide screens, with the filters on phones
  const sortSelect = (
    <FilterSelect
      label="Ordenar"
      value={filters.sort === 'recent' ? null : filters.sort}
      emptyLabel={SORTS[0].label}
      options={SORTS.slice(1)}
      onChange={sort => set({ sort: sort ?? 'recent' })}
      neutral
    />
  );

  return (
    <div id={FILTERS_ELEMENT_ID} className={classes.movieFilters}>
      <div className={classes.searchRow}>
        <SearchBox value={filters.q} onSearch={search} />
        <div className={classes.onWideScreens}>{sortSelect}</div>
        <button
          type="button"
          className={`${classes.toggle} ${activeCount ? classes.isActive : ''}`}
          aria-expanded={isOpen}
          aria-controls={`${FILTERS_ELEMENT_ID}-options`}
          onClick={() => setIsOpen(open => !open)}
        >
          <SlidersHorizontal />
          Filtros
          {activeCount ? <span className={classes.count}>{activeCount}</span> : null}
        </button>
      </div>
      <div id={`${FILTERS_ELEMENT_ID}-options`} className={`${classes.options} ${isOpen ? classes.isOpen : ''}`}>
        <div className={classes.segmented} role="group" aria-label="Tipo">
          {CATEGORIES.map(({ value, label }) => (
            <button
              key={label}
              type="button"
              aria-pressed={filters.category === value}
              onClick={() => set({ category: value })}
            >
              {label}
            </button>
          ))}
        </div>
        <FilterSelect
          label="Gênero"
          value={filters.genre}
          emptyLabel="Todos os gêneros"
          options={genres?.data.map(({ name }) => ({ value: name, label: genreLabel(name) }))
            .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))}
          onChange={genre => set({ genre })}
        />
        <AverageFilter value={filters.averages} onChange={averages => set({ averages })} />
        <FilterSelect
          label="Quem avaliou"
          value={filters.ratedBy}
          emptyLabel="Avaliados por todos"
          options={users?.data.map(({ id, name }) => ({ value: String(id), label: `Avaliados por ${name}` }))}
          onChange={ratedBy => set({ ratedBy })}
        />
        {isReady && isAuthenticated ? (
          <button
            type="button"
            className={classes.chip}
            aria-pressed={filters.unratedByMe}
            onClick={() => set({ unratedByMe: !filters.unratedByMe })}
          >
            Só os que não avaliei
          </button>
        ) : null}
        <div className={classes.onPhones}>{sortSelect}</div>
        {activeCount ? (
          <button
            type="button"
            className={classes.clear}
            onClick={() => set({ ...DEFAULT_FILTERS, sort: filters.sort })}
          >
            <X />
            Limpar filtros
          </button>
        ) : null}
      </div>
    </div>
  );
};

interface SearchBoxProps {
  value: string;
  onSearch: (q: string) => void;
}

/** Searches a moment after typing stops; follows the URL when it changes elsewhere (back button, clear). */
const SearchBox = ({ value, onSearch }: SearchBoxProps) => {
  const [text, setText] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    if (value !== text.trim()) setText(value);
  }

  useEffect(() => {
    const q = text.trim();
    if (q === value) return undefined;

    const timeout = setTimeout(() => onSearch(q), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [text, value, onSearch]);

  return (
    <div className={classes.search}>
      <Search className={classes.searchIcon} />
      <input
        type="search"
        aria-label="Buscar filme ou série"
        placeholder="Buscar filme ou série..."
        value={text}
        onChange={evt => setText(evt.target.value)}
        maxLength={100}
        // Not a form password managers should fill
        data-1p-ignore
        data-lpignore="true"
      />
    </div>
  );
};

interface AverageFilterProps {
  value: RatingKey[];
  onChange: (value: RatingKey[]) => void;
}

/** Pick any of the rating averages; none means any. */
const AverageFilter = ({ value, onChange }: AverageFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panelId = useId();

  // Clicks outside and Esc close it
  useEffect(() => {
    if (!isOpen) return undefined;

    const onMouseDown = (evt: MouseEvent) => {
      if (!ref.current?.contains(evt.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (evt: KeyboardEvent) => {
      if (evt.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  let label = 'Qualquer avaliação';
  if (value.length === 1) label = RATING_LABELS[value[0]];
  else if (value.length > 1) label = `Avaliação (${value.length})`;

  const toggle = (key: RatingKey) => onChange(
    RATING_ORDER.filter(k => (k === key ? !value.includes(k) : value.includes(k))),
  );

  return (
    <div className={classes.popoverField} ref={ref}>
      <button
        type="button"
        className={`${classes.chip} ${classes.hasChevron} ${value.length ? classes.isActive : ''}`}
        aria-label={`Avaliação: ${label}`}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen(open => !open)}
      >
        {label}
        <ChevronDown />
      </button>
      {isOpen ? (
        <fieldset id={panelId} className={classes.popover}>
          <legend className={classes.visuallyHidden}>Médias de avaliação</legend>
          {RATING_ORDER.map(key => (
            <label key={key} className={classes.checkOption}>
              <input type="checkbox" checked={value.includes(key)} onChange={() => toggle(key)} />
              {RATING_LABELS[key]}
            </label>
          ))}
        </fieldset>
      ) : null}
    </div>
  );
};

interface FilterSelectProps<T extends string> {
  label: string;
  value: T | null;
  /** The option meaning "no filter" */
  emptyLabel: string;
  /** Undefined while they load */
  options: { value: T; label: string }[] | undefined;
  onChange: (value: T | null) => void;
  /** Not a filter (the sort): never highlighted as active */
  neutral?: boolean;
}

const FilterSelect = <T extends string>({
  label, value, emptyLabel, options, onChange, neutral = false,
}: FilterSelectProps<T>) => {
  // The URL's value only once its option has loaded: its raw value (a person's id) means nothing to read
  const shown = options ? value : null;

  return (
    <div className={`${classes.select} ${shown && !neutral ? classes.isActive : ''}`}>
      <select
        aria-label={label}
        value={shown ?? ''}
        onChange={evt => onChange((evt.target.value || null) as T | null)}
      >
        <option value="">{emptyLabel}</option>
        {/* A value from the URL the list doesn't offer still shows */}
        {shown && !options?.some(option => option.value === shown) ? <option value={shown}>{shown}</option> : null}
        {options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <ChevronDown className={classes.chevron} />
    </div>
  );
};

export default MovieFilters;
