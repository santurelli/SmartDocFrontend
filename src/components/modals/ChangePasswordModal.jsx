import React, { useState } from 'react';
import Swal from 'sweetalert2';
import authService from '../../services/authService';

const ChangePasswordModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            Swal.fire('Attenzione', 'Le password non corrispondono', 'warning');
            return;
        }

        if (formData.newPassword.length < 6) {
            Swal.fire('Attenzione', 'La nuova password deve essere lunga almeno 6 caratteri', 'warning');
            return;
        }

        setLoading(true);
        try {
            await authService.changePassword(formData.currentPassword, formData.newPassword);
            Swal.fire('Successo', 'Password aggiornata correttamente', 'success');
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            onClose();
        } catch (error) {
            const msg = error.response?.data || 'Errore durante il cambio password';
            Swal.fire('Errore', typeof msg === 'string' ? msg : 'Impossibile cambiare la password', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal show premium-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1200 }}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <form onSubmit={handleSubmit}>
                        <div className="modal-header">
                            <button type="button" className="close" onClick={onClose}>&times;</button>
                            <h4 className="modal-title" style={{ fontWeight: 'bold' }}>Cambia Password</h4>
                        </div>
                        <div className="modal-body" style={{ padding: '25px' }}>
                            <div className="form-group mb-3">
                                <label className="premium-label">Password Attuale</label>
                                <input 
                                    type="password" 
                                    className="form-control premium-input" 
                                    name="currentPassword" 
                                    value={formData.currentPassword} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                            <div className="form-group mb-3">
                                <label className="premium-label">Nuova Password</label>
                                <input 
                                    type="password" 
                                    className="form-control premium-input" 
                                    name="newPassword" 
                                    value={formData.newPassword} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                            <div className="form-group mb-3">
                                <label className="premium-label">Conferma Nuova Password</label>
                                <input 
                                    type="password" 
                                    className="form-control premium-input" 
                                    name="confirmPassword" 
                                    value={formData.confirmPassword} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-premium-cancel" onClick={onClose} disabled={loading}>Annulla</button>
                            <button type="submit" className="btn btn-premium-save" disabled={loading}>
                                {loading ? 'Aggiornamento...' : 'Aggiorna Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
