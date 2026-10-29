import classes from './style.module.scss';

const MAX_WIDTHS = {
  sm: classes.maxWidthSm,
  md: classes.maxWidthMd,
  lg: classes.maxWidthLg,
};

interface ContainerProps {
  children: React.ReactNode;
  maxWidth?: keyof typeof MAX_WIDTHS;
}

const Container = ({ children, maxWidth = 'lg' }: ContainerProps) => (
  <div className={`${classes.container} ${MAX_WIDTHS[maxWidth]}`}>
    {children}
  </div>
);

export default Container;
