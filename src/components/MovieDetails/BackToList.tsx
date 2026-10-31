'use client';

import { ArrowLeft } from 'lucide-react';
import ListLink from '../ListLink/ListLink';
import { useListSearch } from '../MovieFilters/useMovieFilters';
import classes from './style.module.scss';

/** Back to the list this movie was opened from, with its filters (the logo starts over without them). */
const BackToList = () => (
  <ListLink search={useListSearch()} className={classes.backToList}>
    <ArrowLeft />
    Voltar
  </ListLink>
);

export default BackToList;
