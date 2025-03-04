import { Dispatch, SetStateAction, useContext, useState } from 'react';
import { Button, Modal, Container, Grid } from '@mui/material';
import { GeneralContext } from '../../contexts/GeneralContext';
import { MediaRef } from '../../pages/Media';
import ImageUploader from './images/ImagesUploader';
import VideoUploader from './videos/VideoUploader';
import ThreedUploader from './3d/3dUploader';

export type MediaType = 'IMAGE' | 'VIDEO' | 'THREE_D';

interface MediaUploaderProps {
  setMedia: Dispatch<SetStateAction<MediaRef[]>>;
  variant?: MediaType;
}

const MediaUploader = ({ setMedia, variant }: MediaUploaderProps) => {
  const [isModalOpen, setModalOpen] = useState<'image' | 'video' | '3d' | null>(
    null
  );
  const { token, setLoading, preferences } = useContext(GeneralContext);

  if (!token || !preferences) return;

  const handleOpenModal = (modalType: 'image' | 'video' | '3d') => {
    setModalOpen(modalType);
  };

  const handleCloseModal = () => {
    setModalOpen(null);
  };

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)'
  };

  function overrideMedia(response: MediaRef[]) {
    return setMedia((prevList) => {
      const newMedia = response;

      // Override duplicates
      const uniqueMedia = newMedia.filter((newMediaItem) => {
        if (!newMediaItem) return;
        return !prevList.some((media) => {
          return media && media.etag === newMediaItem.etag;
        });
      });

      // Return list without duplicates
      return [...uniqueMedia, ...prevList];
    });
  }

  return (
    <>
      {variant !== 'VIDEO' && (
        <Button
          onClick={() => handleOpenModal('image')}
          disabled={!preferences.enable_images as boolean}
        >
          Upload New Images
        </Button>
      )}
      {variant !== 'IMAGE' && (
        <Button onClick={() => handleOpenModal('video')}>
          Upload New Video
        </Button>
      )}
      {variant !== 'IMAGE' && variant !== 'VIDEO' && (
        <Button
          onClick={() => handleOpenModal('3d')}
          disabled={!preferences.enable_3D as boolean}
        >
          Upload New 3D Object
        </Button>
      )}

      <Modal open={isModalOpen === 'image'} onClose={handleCloseModal}>
        <Container sx={modalStyle}>
          <ImageUploader
            token={token}
            overrideMedia={overrideMedia}
            setLoading={setLoading}
          />
        </Container>
      </Modal>

      <Modal open={isModalOpen === 'video'} onClose={handleCloseModal}>
        <Container sx={modalStyle}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <VideoUploader
                token={token}
                preferences={preferences}
                overrideMedia={overrideMedia}
                setLoading={setLoading}
              />
            </Grid>
          </Grid>
        </Container>
      </Modal>

      <Modal open={isModalOpen === '3d'} onClose={handleCloseModal}>
        <Container sx={modalStyle}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <ThreedUploader
                token={token}
                overrideMedia={overrideMedia}
                setLoading={setLoading}
              />
            </Grid>
          </Grid>
        </Container>
      </Modal>
    </>
  );
};

export default MediaUploader;
