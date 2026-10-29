'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { refreshMovieCaches } from '@/app/actions';
import { ApiError, apiFetch } from '@/lib/api';
import { RATING_LABELS } from '@/lib/ratings';
import useAuth from '../Auth/AuthProvider';
import Modal from '../Modal/Modal';
import { useMovieList } from '../MovieList/MovieListProvider';
import { TOOLTIP_ID } from '../Providers/Providers';
import { useToast } from '../Toast/ToastProvider';
import NewThreadButton from './NewThreadButton/NewThreadButton';
import classes from './style.module.scss';

const NewThread = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [rating, setRating] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, loading } = useAuth();
  const { showToast } = useToast();
  const { refresh: refreshMovies } = useMovieList();

  const showModal = () => {
    setRating('');
    setModalVisible(true);
  };

  const hideModal = () => setModalVisible(false);

  const handleSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    const form = new FormData(evt.currentTarget);
    setIsSubmitting(true);

    try {
      const { movie } = await apiFetch<{ movie: { id: number; slug: string } }>('/ratings', {
        method: 'POST',
        body: JSON.stringify({
          url: form.get('url'),
          rating: form.get('rating'),
          comment: form.get('comment'),
        }),
      });
      showToast({
        type: 'success',
        title: 'Yay!',
        text: 'Sua avaliação foi enviada com sucesso.',
        duration: 5000,
      });
      hideModal();
      // The rating is saved either way; at worst the cached pages catch up a few minutes later
      await refreshMovieCaches(movie.id).catch(() => undefined);
      refreshMovies();
    } catch (err) {
      const unauthorized = err instanceof ApiError && err.status === 401;
      showToast({
        type: 'error',
        title: 'Ops!',
        text: unauthorized
          ? 'Você deve fazer login antes de enviar uma avaliação.'
          : (err instanceof ApiError && err.detail) || 'Não foi possível enviar sua avaliação. Tente de novo.',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className={classes.buttonWrapper}>
        {/* The tooltip anchors here, the button's size: a disabled button gets no mouse events */}
        <div
          data-tooltip-id={!isAuthenticated && !loading ? TOOLTIP_ID : undefined}
          data-tooltip-content="Você deve estar logado para enviar uma avaliação."
        >
          <NewThreadButton onClick={showModal} disabled={!isAuthenticated} />
        </div>
      </div>
      <Modal isOpen={modalVisible} onRequestClose={hideModal}>
        <div className={classes.newThreadForm}>
          <form onSubmit={handleSubmit}>
            <div className={classes.field}>
              <label htmlFor="url">Filme/Série *</label>
              <input
                type="text"
                name="url"
                id="url"
                placeholder="Digite o link do imdb ou tmdb..."
                required
              />
            </div>
            <div className={classes.field}>
              <label htmlFor="rating">Avaliação *</label>
              <select
                name="rating"
                id="rating"
                className={!rating ? classes.isEmpty : ''}
                value={rating}
                onChange={evt => setRating(evt.target.value)}
                required
              >
                <option value="" disabled>
                  Selecione uma opção...
                </option>
                {Object.entries(RATING_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <div className={classes.suffix}>
                <ChevronDown />
              </div>
            </div>
            <div className={classes.field}>
              <label htmlFor="comment">Comentário</label>
              <textarea
                name="comment"
                id="comment"
                placeholder="Escreva uma análise..."
              />
            </div>
            <div className={classes.field}>
              <button type="button" className="button is-red" onClick={hideModal} disabled={isSubmitting}>
                Cancelar
              </button>
              <button type="submit" className="button is-green" disabled={isSubmitting}>
                Enviar
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default NewThread;
