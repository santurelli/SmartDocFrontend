import React, { useState } from 'react';
import { FaWrench } from 'react-icons/fa';

/**
 * Reusable component for a wrench icon button that opens a management modal.
 * 
 * @param {Object} props
 * @param {React.Component} props.ModalComponent - The modal component to render.
 * @param {Object} props.modalProps - Additional props to pass to the modal component.
 * @param {string} props.title - Tooltip title for the button.
 * @param {Function} props.onClose - Callback when the modal is closed.
 */
const WrenchModalButton = ({ ModalComponent, modalProps = {}, title = "Gestione", onClose }) => {
    const [showModal, setShowModal] = useState(false);

    const handleOpen = () => setShowModal(true);
    const handleClose = () => {
        setShowModal(false);
        if (onClose) onClose();
    };

    return (
        <>
            <button
                type="button"
                className="premium-wrench-btn"
                onClick={handleOpen}
                title={title}
            >
                <FaWrench />
            </button>
            {showModal && (
                <ModalComponent
                    isOpen={true}
                    onClose={handleClose}
                    {...modalProps}
                />
            )}
        </>
    );
};

export default WrenchModalButton;
