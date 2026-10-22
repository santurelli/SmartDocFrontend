import React from 'react';
import { useNavigate } from 'react-router-dom';
import MarcheManagementModal from '../../components/modals/MarcheManagementModal';

const MarcheList = () => {
    const navigate = useNavigate();

    return (
        <MarcheManagementModal
            isOpen={true}
            onClose={() => navigate(-1)}
        />
    );
};

export default MarcheList;
