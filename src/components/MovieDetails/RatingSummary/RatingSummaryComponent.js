import PropTypes from 'prop-types';
import classes from './style.module.scss';

const RatingSummaryComponent = ({ rating }) => (
  <div className={classes.ratingSummary}>
    <div className={classes.item}>
      <div className={classes.number}>{rating.count}</div>
      <div className={classes.title}>{rating.count > 1 ? 'Avaliações' : 'Avaliação'}</div>
    </div>
    <div className={classes.item}>
      <div className={classes.number}>{rating.average}</div>
      <div className={classes.title}>Média</div>
    </div>
    <div className={classes.item}>
      <div className={classes.number}>{rating.last}</div>
      <div className={classes.title}>Última</div>
    </div>
  </div>
);

RatingSummaryComponent.propTypes = {
  rating: PropTypes.object.isRequired,
};

export default RatingSummaryComponent;
