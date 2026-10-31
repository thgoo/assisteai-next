'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { refreshMovieCaches } from '@/app/actions';
import { ApiError, apiFetch } from '@/lib/api';
import { RATING_LABELS } from '@/lib/ratings';
import useAuth from '../Auth/AuthProvider';
import { useCurrentMovie } from '../CurrentMovie/CurrentMovie';
import Modal from '../Modal/Modal';
import { MOVIES_CHANGED_EVENT } from '../MovieList/MovieListProvider';
import { useToast } from '../Toast/ToastProvider';
import NewThreadButton from './NewThreadButton/NewThreadButton';
import TitleField from './TitleField/TitleField';
import classes from './style.module.scss';

const NewThread = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [rating, setRating] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, loading, openLogin } = useAuth();
  const { showToast } = useToast();
  // On a movie's page, the form starts from that movie
  const currentMovie = useCurrentMovie();

  const showModal = () => {
    setRating('');
    setModalVisible(true);
  };

  const hideModal = () => setModalVisible(false);

  const handleSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    const form = new FormData(evt.currentTarget);
    if (!form.get('url')) {
      showToast({
        type: 'error',
        title: 'Ops!',
        text: 'Escolha um título da lista ou cole o link do IMDb ou do TMDb.',
        duration: 5000,
      });
      return;
    }
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
      window.dispatchEvent(new Event(MOVIES_CHANGED_EVENT));
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
      {/* Shows with the header's "Entrar" or avatar, once the session check answers, so neither pushes the other */}
      {loading ? null : (
        // Visitors without a session sign in first, then get the form
        <NewThreadButton onClick={() => (isAuthenticated ? showModal() : openLogin(showModal))} />
      )}
      <Modal isOpen={modalVisible} onRequestClose={hideModal}>
        <div className={classes.newThreadForm}>
          <form onSubmit={handleSubmit}>
            <div className={classes.field}>
              <label htmlFor="url">Filme/Série *</label>
              <TitleField id="url" name="url" suggestion={currentMovie} />
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
