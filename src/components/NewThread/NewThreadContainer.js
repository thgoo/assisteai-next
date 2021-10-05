import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useFormik } from 'formik';
import NewThreadComponent from './NewThreadComponent';
import api from '../../services/api';
import { showToast } from '../../store/ducks/toasts';
import useAuth from '../Auth/AuthProvider';
import { mutate } from 'swr';

const NewThreadContainer = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const { isAuthenticated } = useAuth();
  const dispatch = useDispatch();

  const showModal = () => {
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
  };

  const handleSubmit = async (values) => {
    try {
      await api.post('movies/ratings', values);
      dispatch(showToast({
        type: 'success',
        title: 'Yay!',
        text: 'Sua avaliação foi enviada com sucesso.',
        duration: 5000,
      }));
      hideModal();
      mutate('/movies?page=1'); // reload first page to show new movie
    } catch ({ response }) {
      if (response.status === 401) {
        dispatch(showToast({
          type: 'error',
          title: 'Ops!',
          text: 'Você deve fazer login antes de enviar uma avaliação.',
          duration: 5000,
        }));
      } else {
        dispatch(showToast({
          type: 'error',
          title: 'Ops!',
          text: response.data.message,
          duration: 5000,
        }));
      }
    }
  };

  const formik = useFormik(
    {
      initialValues: {
        url: '',
        rating: '',
        comment: '',
      },
      onSubmit: handleSubmit,
    }
  );

  useEffect(() => {
    formik.resetForm();
  }, [modalVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <NewThreadComponent
      modalVisible={modalVisible}
      showModal={showModal}
      hideModal={hideModal}
      formik={formik}
      isAuthenticated={isAuthenticated}
    />
  );
};

export default NewThreadContainer;
