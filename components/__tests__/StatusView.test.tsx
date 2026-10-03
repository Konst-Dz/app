import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { TestInstance } from 'test-renderer';

import { ThemeProvider } from '@/theme/ThemeContext';

import { StatusView } from '../StatusView';

function renderStatusView(props: Parameters<typeof StatusView>[0]) {
  return render(
    <ThemeProvider>
      <StatusView {...props} />
    </ThemeProvider>,
  );
}

function findSpinners(view: { root: TestInstance | null }): TestInstance[] {
  return view.root?.queryAll((node) => node.props?.size === 'large') ?? [];
}

describe('StatusView', () => {
  it('renders the label only by default', async () => {
    const view = await renderStatusView({ label: 'Пусто' });

    expect(screen.getByText('Пусто')).toBeOnTheScreen();
    expect(findSpinners(view)).toHaveLength(0);
    expect(screen.queryByText('Повторить')).toBeNull();
  });

  it('renders a spinner when requested', async () => {
    const view = await renderStatusView({
      label: 'Загрузка…',
      withSpinner: true,
    });

    expect(findSpinners(view)).toHaveLength(1);
  });

  it('renders the optional detail line', async () => {
    await renderStatusView({ label: 'Ошибка', detail: 'db locked' });

    expect(screen.getByText('Ошибка')).toBeOnTheScreen();
    expect(screen.getByText('db locked')).toBeOnTheScreen();
  });

  it('calls onRetry when the retry button is pressed', async () => {
    const onRetry = jest.fn<() => void>();
    await renderStatusView({ label: 'Ошибка', onRetry });

    await fireEvent.press(screen.getByText('Повторить'));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
