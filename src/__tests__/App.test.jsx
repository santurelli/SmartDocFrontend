import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';
import authService from '../services/authService';
import { MemoryRouter } from 'react-router-dom';

// Mock authService
vi.mock('../services/authService', () => ({
    default: {
        getCurrentUser: vi.fn(),
        logout: vi.fn(),
    }
}));

// Mock child components to avoid side effects
vi.mock('../pages/Login', () => ({ default: () => <div>Login Page</div> }));
vi.mock('../components/Header', () => ({ default: () => <div>Header</div> }));
vi.mock('../components/Sidebar', () => ({ default: () => <div>Sidebar</div> }));
vi.mock('../pages/Clienti/ClientiList', () => ({ default: () => <div>Clienti List</div> }));

describe('App Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders login page when user is not authenticated', () => {
        authService.getCurrentUser.mockReturnValue(null);

        render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>
        );

        expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
        expect(screen.queryByText(/Dashboard/i)).not.toBeInTheDocument();
    });

    it('renders dashboard when user is authenticated', () => {
        const mockUser = {
            user: {
                nome: 'Mario',
                cognome: 'Rossi',
                nomeAzienda: 'Test Corp'
            }
        };
        authService.getCurrentUser.mockReturnValue(mockUser);

        render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>
        );

        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
        expect(screen.getByText(/Mario Rossi/i)).toBeInTheDocument();
    });
});
