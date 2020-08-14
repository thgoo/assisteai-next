import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/pro-solid-svg-icons';
import NewThreadButton from './NewThreadButton';
import classes from './style.module.scss';
import Modal from '../Modal';

const NewThreadComponent = ({
  formik: {
    handleSubmit,
    handleChange,
    isSubmitting,
    values,
  },
  modalVisible,
  hideModal,
  showModal,
  isAuthenticated,
}) => (
  <div className={classes.newThread}>
    <div className={classes.buttonWrapper} data-tip={!isAuthenticated ? 'Você deve estar logado para enviar uma avaliação.' : null}>
      <NewThreadButton
        onClick={showModal}
        disabled={!isAuthenticated}
      />
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
              value={values.url}
              onChange={handleChange}
              required
            />
          </div>
          <div className={classes.field}>
            <label htmlFor="rating">Avaliação *</label>
            <select
              name="rating"
              id="rating"
              className={!values.rating ? classes.isEmpty : ''}
              onChange={handleChange}
              defaultValue={values.rating}
              required
            >
              <option value="" disabled>Selecione uma opção...</option>
              <option value="UNMISSABLE">Imperdível</option>
              <option value="VERY_GOOD">Muito bom</option>
              <option value="GOOD">Bom</option>
              <option value="COOL">Legal</option>
              <option value="BAD">Ruinzinho</option>
              <option value="VERY_BAD">Muito ruim</option>
              <option value="STAY_AWAY">Fique longe</option>
            </select>
            <div className={classes.suffix}>
              <FontAwesomeIcon icon={faChevronDown} />
            </div>
          </div>
          <div className={classes.field}>
            <label htmlFor="comment">Comentário</label>
            <textarea
              name="comment"
              id="comment"
              placeholder="Escreva uma análise..."
              value={values.comment}
              onChange={handleChange}
            />
          </div>
          <div className={classes.field}>
            <button type="button" className="button is-red" onClick={hideModal} disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="button is-green" disabled={isSubmitting}>Enviar</button>
          </div>
        </form>
      </div>
    </Modal>
  </div>
);

NewThreadComponent.propTypes = {
  formik: PropTypes.object.isRequired,
  modalVisible: PropTypes.bool.isRequired,
  hideModal: PropTypes.func.isRequired,
  showModal: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool.isRequired,
};

export default NewThreadComponent;
