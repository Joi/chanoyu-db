import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchSelect from './SearchSelect';

describe('SearchSelect', () => {
  it('debounces search and shows results', async () => {
    vi.spyOn(global, 'fetch' as any).mockResolvedValue({ ok: true, json: async () => [{ id: '1', name: 'Foo' }] } as any);
    render(
      <SearchSelect name="x" label="Test" searchPath="/api/search/locations" valueKey="id" labelFields={["name"]} />
    );
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'fo' } });
    await waitFor(() => expect(global.fetch).toHaveBeenCalled(), { timeout: 1000 });
    expect(await screen.findByRole('option')).toBeTruthy();
    (global.fetch as any).mockRestore?.();
  });
});


