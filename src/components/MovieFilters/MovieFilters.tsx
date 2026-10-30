'use client';

import { useCallback, useEffect, useState } from 'react';
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

// "At least": the lowest one would keep everything, so it isn't offered
const MIN_RATINGS = (Object.keys(RATING_LABELS) as RatingKey[])
  .filter(key => key !== 'STAY_AWAY')
  .map(key => ({ value: key, label: key === 'UNMISSABLE' ? RATING_LABELS[key] : `${RATING_LABELS[key]} ou melhor` }));

const SORTS: { value: MovieSort; label: string }[] = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'rating', label: 'Melhor média' },
  { value: 'popular', label: 'Mais avaliados' },
];

interface MovieFiltersProps {
  /** Shown at the end of the search row (the "Nova indicação" button) */
  action?: React.ReactNode;
}

/** Search, filters and sort for the movie list, kept in the URL (useMovieFilters). */
const MovieFilters = ({ action = null }: MovieFiltersProps) => {
  const { filters, setFilters } = useMovieFilters();
  const { isAuthenticated } = useAuth();
  const { data: genres } = useSWR<{ data: GenreCount[] }>('/genres');
  const { data: users } = useSWR<{ data: PublicUser[] }>('/users');
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
        {action}
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
          options={(genres?.data ?? []).map(({ name }) => ({ value: name, label: genreLabel(name) }))
            .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))}
          onChange={genre => set({ genre })}
        />
        <FilterSelect
          label="Avaliação"
          value={filters.minRating}
          emptyLabel="Qualquer avaliação"
          options={MIN_RATINGS}
          onChange={minRating => set({ minRating })}
        />
        <FilterSelect
          label="Quem avaliou"
          value={filters.ratedBy}
          emptyLabel="Avaliados por todos"
          options={(users?.data ?? []).map(({ id, name }) => ({ value: id, label: `Avaliados por ${name}` }))}
          onChange={ratedBy => set({ ratedBy })}
        />
        {isAuthenticated ? (
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

interface FilterSelectProps<T extends string> {
  label: string;
  value: T | null;
  /** The option meaning "no filter" */
  emptyLabel: string;
  options: { value: T; label: string }[];
  onChange: (value: T | null) => void;
  /** Not a filter (the sort): never highlighted as active */
  neutral?: boolean;
}

const FilterSelect = <T extends string>({
  label, value, emptyLabel, options, onChange, neutral = false,
}: FilterSelectProps<T>) => (
  <div className={`${classes.select} ${value && !neutral ? classes.isActive : ''}`}>
    <select
      aria-label={label}
      value={value ?? ''}
      onChange={evt => onChange((evt.target.value || null) as T | null)}
    >
      <option value="">{emptyLabel}</option>
      {/* A value from the URL the list doesn't offer (yet) still shows */}
      {value && !options.some(option => option.value === value) ? <option value={value}>{value}</option> : null}
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
    <ChevronDown className={classes.chevron} />
  </div>
);

export default MovieFilters;
