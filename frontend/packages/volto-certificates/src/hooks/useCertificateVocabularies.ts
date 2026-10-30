import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCertificateVocabularies } from '../actions/certificates';
import type { CertificatesState } from '../reducers/certificates';

/** Fonts, fields, field kinds and QR levels, loaded once per session. */
export default function useCertificateVocabularies(): CertificatesState {
  const dispatch = useDispatch();
  const state = useSelector(
    (store: { certificates: CertificatesState }) => store.certificates,
  );
  const { loading, loaded } = state.vocabularies;
  useEffect(() => {
    if (!loading && !loaded) dispatch(getCertificateVocabularies());
  }, [dispatch, loading, loaded]);
  return state;
}
