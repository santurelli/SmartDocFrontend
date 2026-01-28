import { FaCloudDownloadAlt } from 'react-icons/fa';
import './DownloadProgress.css';

const DownloadProgress = ({ visible }) => {
    if (!visible) return null;

    return (
        <div className="download-progress-overlay">
            <div className="download-progress-container">
                <div className="download-progress-header">
                    <FaCloudDownloadAlt size={48} className="mb-3 text-info" style={{ color: '#3498db' }} />
                    <h3>Elaborazione in corso...</h3>
                    <p>Attendere il completamento della generazione del file.</p>
                </div>
                <div className="progress thin-progress">
                    <div className="progress-bar progress-bar-striped active indeterminate-progress" role="progressbar"></div>
                </div>
            </div>
        </div>
    );
};

export default DownloadProgress;
