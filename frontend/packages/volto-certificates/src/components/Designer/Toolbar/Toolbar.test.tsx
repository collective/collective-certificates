import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWith } from '../../../testing/render';
import Toolbar from './Toolbar';
import type { ToolbarProps } from './Toolbar';

const props = (overrides: Partial<ToolbarProps> = {}): ToolbarProps => ({
  hasSelection: true,
  canUndo: true,
  canRedo: true,
  canZoomIn: true,
  canZoomOut: true,
  zoom: 0.25,
  showSample: true,
  applying: false,
  onAdd: vi.fn(),
  onUndo: vi.fn(),
  onRedo: vi.fn(),
  onDuplicate: vi.fn(),
  onDelete: vi.fn(),
  onZoom: vi.fn(),
  onToggleSample: vi.fn(),
  onApply: vi.fn(),
  onCancel: vi.fn(),
  ...overrides,
});

const button = (name: string) =>
  screen.getByRole('button', { name }) as HTMLButtonElement;

describe('Toolbar', () => {
  it('calls every action', () => {
    const p = props();
    renderWith(<Toolbar {...p} />);
    fireEvent.click(button('Add text'));
    fireEvent.click(button('Add image'));
    fireEvent.click(button('Add QR code'));
    expect(p.onAdd).toHaveBeenNthCalledWith(1, 'text');
    expect(p.onAdd).toHaveBeenNthCalledWith(2, 'image');
    expect(p.onAdd).toHaveBeenNthCalledWith(3, 'qrcode');
    fireEvent.click(button('Undo'));
    fireEvent.click(button('Redo'));
    fireEvent.click(button('Duplicate'));
    fireEvent.click(button('Delete'));
    fireEvent.click(button('Zoom in'));
    fireEvent.click(button('Zoom out'));
    fireEvent.click(button('Apply'));
    fireEvent.click(button('Cancel'));
    fireEvent.click(screen.getByLabelText('Show sample data'));
    expect(p.onUndo).toHaveBeenCalled();
    expect(p.onRedo).toHaveBeenCalled();
    expect(p.onDuplicate).toHaveBeenCalled();
    expect(p.onDelete).toHaveBeenCalled();
    expect(p.onZoom).toHaveBeenNthCalledWith(1, 1);
    expect(p.onZoom).toHaveBeenNthCalledWith(2, -1);
    expect(p.onApply).toHaveBeenCalled();
    expect(p.onCancel).toHaveBeenCalled();
    expect(p.onToggleSample).toHaveBeenCalledWith(false);
  });

  it('disables what cannot be done', () => {
    renderWith(
      <Toolbar
        {...props({
          hasSelection: false,
          canUndo: false,
          canRedo: false,
          canZoomIn: false,
          canZoomOut: false,
          applying: true,
        })}
      />,
    );
    for (const name of [
      'Undo',
      'Redo',
      'Duplicate',
      'Delete',
      'Zoom in',
      'Zoom out',
      'Checking…',
    ])
      expect(button(name).disabled).toBe(true);
  });

  it('shows the zoom level', () => {
    renderWith(<Toolbar {...props({ zoom: 0.33 })} />);
    expect(screen.getByText('Zoom 33%')).toBeTruthy();
  });
});
