import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PointListEditor, cleanTextEntities } from '../components/PointListEditor';
import { CorporateGiftingEditor } from '../components/CorporateGiftingEditor';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import { AdminDataProvider } from '../context/AdminDataContext';
import { AdminProducts } from '../pages/admin/AdminProducts';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: vi.fn().mockReturnValue(false),
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn().mockImplementation((fn) => Promise.resolve(fn({ data: [], error: null })))
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis()
    })),
    removeChannel: vi.fn()
  }
}));

describe('PointListEditor Component Suite', () => {
  it('cleanTextEntities decodes entities but preserves typing spaces', () => {
    // Entities decoded
    expect(cleanTextEntities('Coconut&#x20;Oil')).toBe('Coconut Oil');
    expect(cleanTextEntities('Salt&nbsp;&amp;&nbsp;Pepper')).toBe('Salt & Pepper');
    // Trailing space preserved during active typing
    expect(cleanTextEntities('Kerala ')).toBe('Kerala ');
  });

  const ControlledWrapper = () => {
    const [points, setPoints] = useState<string[]>(['Point One', 'Point Two']);
    return (
      <PointListEditor
        label="Test Points"
        points={points}
        onChange={setPoints}
        placeholder="Type a point..."
      />
    );
  };

  it('renders all initial points and point count', () => {
    render(<ControlledWrapper />);
    expect(screen.getByText('Test Points')).toBeInTheDocument();
    expect(screen.getByText('2 point(s)')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Point One')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Point Two')).toBeInTheDocument();
  });

  it('clicking Add Point creates an empty point and focuses it', async () => {
    render(<ControlledWrapper />);
    const addBtn = screen.getByRole('button', { name: /add point/i });
    fireEvent.click(addBtn);

    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(3);
    expect(inputs[2]).toHaveValue('');
    expect(document.activeElement).toBe(inputs[2]);
  });

  it('allows typing spaces between words without premature trimming', async () => {
    render(<ControlledWrapper />);
    const addBtn = screen.getByRole('button', { name: /add point/i });
    fireEvent.click(addBtn);

    const inputs = screen.getAllByRole('textbox');
    const newField = inputs[2];

    fireEvent.change(newField, { target: { value: 'Crispy ' } });
    expect(newField).toHaveValue('Crispy ');

    fireEvent.change(newField, { target: { value: 'Crispy Banana ' } });
    expect(newField).toHaveValue('Crispy Banana ');

    fireEvent.change(newField, { target: { value: 'Crispy Banana Chips' } });
    expect(newField).toHaveValue('Crispy Banana Chips');

    // On blur, trailing whitespace is tidied
    fireEvent.change(newField, { target: { value: 'Crispy Banana Chips  ' } });
    fireEvent.blur(newField);
    expect(newField).toHaveValue('Crispy Banana Chips');
  });

  it('pressing Enter on a point creates a new line below and focuses it', () => {
    render(<ControlledWrapper />);
    const inputs = screen.getAllByRole('textbox');
    fireEvent.keyDown(inputs[0], { key: 'Enter' });

    const updatedInputs = screen.getAllByRole('textbox');
    expect(updatedInputs).toHaveLength(3);
    expect(updatedInputs[0]).toHaveValue('Point One');
    expect(updatedInputs[1]).toHaveValue('');
    expect(updatedInputs[2]).toHaveValue('Point Two');
    expect(document.activeElement).toBe(updatedInputs[1]);
  });

  it('reorders points up and down', () => {
    render(<ControlledWrapper />);
    const moveDownButtons = screen.getAllByTitle('Move down');
    fireEvent.click(moveDownButtons[0]);

    const inputs = screen.getAllByRole('textbox');
    expect(inputs[0]).toHaveValue('Point Two');
    expect(inputs[1]).toHaveValue('Point One');

    const moveUpButtons = screen.getAllByTitle('Move up');
    fireEvent.click(moveUpButtons[1]);

    const restoredInputs = screen.getAllByRole('textbox');
    expect(restoredInputs[0]).toHaveValue('Point One');
    expect(restoredInputs[1]).toHaveValue('Point Two');
  });

  it('removes points with Trash button', () => {
    render(<ControlledWrapper />);
    const removeButtons = screen.getAllByTitle('Remove point');
    fireEvent.click(removeButtons[0]);

    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(1);
    expect(inputs[0]).toHaveValue('Point Two');
  });
});

describe('AdminProducts Integration: Add Point Button Verification', () => {
  it('opens create modal and adds points to Description and Ingredients without loss', async () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <AuthProvider>
            <AdminDataProvider>
              <AdminProducts />
            </AdminDataProvider>
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    // Click "Add New Product" button
    const addProductBtn = screen.getByRole('button', { name: /add new product/i });
    fireEvent.click(addProductBtn);

    // Check modal opened
    expect(screen.getByRole('heading', { name: /add new product/i })).toBeInTheDocument();

    // Verify Add Point buttons are rendered
    const addPointButtons = screen.getAllByRole('button', { name: /add point/i });
    expect(addPointButtons.length).toBeGreaterThanOrEqual(2); // Description + Ingredients

    // Click Add Point on Description
    const descAddPointBtn = addPointButtons[0];
    fireEvent.click(descAddPointBtn);

    // Description should now have 2 point inputs
    const inputs = screen.getAllByRole('textbox');
    const descInputs = inputs.filter((input) =>
      input.getAttribute('placeholder')?.includes('Type key product story')
    );
    expect(descInputs).toHaveLength(2);

    fireEvent.change(descInputs[1], { target: { value: 'Handmade with A2 Ghee' } });
    expect(descInputs[1]).toHaveValue('Handmade with A2 Ghee');

    // Click Add Point on Ingredients
    const ingAddPointBtn = addPointButtons[1];
    fireEvent.click(ingAddPointBtn);

    const ingInputs = screen.getAllByRole('textbox').filter((input) =>
      input.getAttribute('placeholder')?.includes('Raw Kerala Bananas')
    );
    expect(ingInputs.length).toBeGreaterThan(1);

    // Toggle description mode to raw text and back to verify sync
    const switchDescBtn = screen.getByRole('button', { name: /switch to raw text/i });
    fireEvent.click(switchDescBtn);

    // Textarea should contain the point
    const textarea = screen.getByPlaceholderText(/Detailed culinary and preparation story/i);
    expect(textarea).toHaveValue('Handmade with A2 Ghee');

    // Switch back to bullet points
    const switchBackBtn = screen.getByRole('button', { name: /switch to bullet points/i });
    fireEvent.click(switchBackBtn);

    // Point should still be present in the bullet editor
    expect(screen.getByDisplayValue('Handmade with A2 Ghee')).toBeInTheDocument();
  });
});

describe('CorporateGiftingEditor Integration: Add Point Button Verification', () => {
  it('renders PointListEditor and adds points to corporate highlights', async () => {
    const mockSave = vi.fn().mockResolvedValue({ success: true });
    const initialConfig = {
      id: 'h0000000-0000-0000-0000-000000000003',
      eyebrow: 'Corporate & Wedding Gifting',
      heading: 'Planning a Festive Gathering?',
      description: 'Customized Kerala delicacy boxes.',
      bulletPoints: ['Corporate gifting hampers', 'Wedding delicacy boxes'],
      primaryCtaLabel: 'Discuss a Custom Order',
      primaryCtaDestination: '/bulk-orders',
      secondaryCtaLabel: 'Chat on WhatsApp',
      secondaryCtaDestination: 'https://wa.me/917593959235',
      bgPreset: '#072C20',
      textColor: '#FFFFFF',
      isActive: true,
      displayOrder: 7,
      desktopVisible: true,
      mobileVisible: true
    };

    render(
      <ToastProvider>
        <CorporateGiftingEditor
          section={initialConfig}
          onSave={mockSave}
          canManage={true}
        />
      </ToastProvider>
    );

    // Check heading rendered
    expect(screen.getByText('Key Highlights / Bullet Points')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Corporate gifting hampers')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Wedding delicacy boxes')).toBeInTheDocument();

    // Click "Add Point" button
    const addPointBtn = screen.getByRole('button', { name: /add point/i });
    fireEvent.click(addPointBtn);

    // Third input should appear
    const inputs = screen.getAllByPlaceholderText('e.g. Customized Kerala delicacy boxes');
    expect(inputs).toHaveLength(3);

    // Type new highlight
    fireEvent.change(inputs[2], { target: { value: 'Custom logo ribbons & brass diyas' } });
    expect(inputs[2]).toHaveValue('Custom logo ribbons & brass diyas');

    // Save and check payload
    const saveBtn = screen.getAllByRole('button', { name: /save corporate banner/i })[0];
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    const savedConfig = mockSave.mock.calls[0][0];
    expect(savedConfig.bulletPoints).toEqual([
      'Corporate gifting hampers',
      'Wedding delicacy boxes',
      'Custom logo ribbons & brass diyas'
    ]);
  });
});
