import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

describe('Simple Router Test', () => {
    it('renders correct route', () => {
        render(
            <MemoryRouter initialEntries={['/test']}>
                <Routes>
                    <Route path="/" element={<div>Home</div>} />
                    <Route path="/test" element={<div>Test Page</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText(/Test Page/i)).toBeInTheDocument();
        expect(screen.queryByText(/Home/i)).not.toBeInTheDocument();
    });
});
