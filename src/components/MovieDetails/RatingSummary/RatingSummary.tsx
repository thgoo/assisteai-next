import { ratingLabel } from '@/lib/ratings';
import type { RatingSummary as RatingSummaryData } from '@/lib/types';
import classes from './style.module.scss';

const RatingSummary = ({ rating }: { rating: RatingSummaryData }) => (
  <div className={classes.ratingSummary}>
    <div className={classes.item}>
      <div className={classes.number}>{rating.count}</div>
      <div className={classes.title}>{rating.count !== 1 ? 'Avaliações' : 'Avaliação'}</div>
    </div>
    <div className={classes.item}>
      <div className={classes.number}>{ratingLabel(rating.average)}</div>
      <div className={classes.title}>Média</div>
    </div>
    <div className={classes.item}>
      <div className={classes.number}>{ratingLabel(rating.last)}</div>
      <div className={classes.title}>Última</div>
    </div>
  </div>
);

export default RatingSummary;
