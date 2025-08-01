import React from 'react';
import Modal from './Modal.js';
import { Button } from './Button.js';
import { useUiStore } from '../../stores/uiStore.js';
import { ALERT_TRIANGLE_ICON } from '../icons/index.js';

const ConfirmationModal: React.FC = () => {
  const {
    isConfirmationOpen,
    confirmationTitle,
    confirmationMessage,
    onConfirmAction,
    hideConfirmation,
  } = useUiStore();

  const handleConfirm = () => {
    if (onConfirmAction) {
      onConfirmAction();
    }
    hideConfirmation();
  };

  if (!isConfirmationOpen) {
    return null;
  }

  return (
    <Modal isOpen={isConfirmationOpen} onClose={hideConfirmation} title={confirmationTitle}>
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <ALERT_TRIANGLE_ICON className="h-6 w-6 text-destructive" aria-hidden="true" />
        </div>
        <div className="mt-3 text-center sm:mt-5">
          <p className="text-base text-foreground">
            {confirmationMessage}
          </p>
        </div>
      </div>
      <div className="mt-5 sm:mt-6 flex justify-center gap-3 border-t border-border pt-5">
        <Button
          type="button"
          variant="outline"
          onClick={hideConfirmation}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={handleConfirm}
        >
          Confirmar
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
