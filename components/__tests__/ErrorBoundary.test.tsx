import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { logger } from '@/lib/logger';
import { ThemeProvider } from '@/theme/ThemeContext';

import { ErrorBoundary } from '../ErrorBoundary';

let shouldThrow = false;

function Bomb({ label }: { label: string }) {
  if (shouldThrow) {
    throw new Error('boom');
  }
  return <Text>{label}</Text>;
}

function renderBoundary() {
  return render(
    <ThemeProvider>
      <ErrorBoundary>
        <Bomb label="content" />
      </ErrorBoundary>
    </ThemeProvider>,
  );
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = false;
    jest.spyOn(logger, 'debug').mockImplementation(() => {});
    jest.spyOn(logger, 'warn').mockImplementation(() => {});
    jest.spyOn(logger, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when no error is thrown', async () => {
    await renderBoundary();

    expect(screen.getByText('content')).toBeOnTheScreen();
  });

  it('shows the fallback with a dev detail and reports the error', async () => {
    shouldThrow = true;

    await renderBoundary();

    expect(screen.getByText('Не удалось загрузить данные')).toBeOnTheScreen();
    expect(screen.getByText('boom')).toBeOnTheScreen();
    expect(logger.error).toHaveBeenCalledWith(
      'ErrorBoundary',
      'Render error caught',
      expect.objectContaining({ message: 'boom' }),
    );
  });

  it('restores children after retry', async () => {
    shouldThrow = true;

    await renderBoundary();

    shouldThrow = false;
    await fireEvent.press(screen.getByText('Повторить'));

    expect(screen.getByText('content')).toBeOnTheScreen();
    expect(logger.debug).toHaveBeenCalledWith(
      'ErrorBoundary',
      'Error reset requested',
    );
  });
});
