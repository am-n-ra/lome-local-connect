// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationCenterV13 } from './NotificationCenterV13';
import type { NotificationSummary } from './types';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => { root.unmount(); });
  container.remove();
  vi.restoreAllMocks();
});

const inbox: NotificationSummary[] = [
  {
    id: 'notif-1', eventType: 'claim_reviewed', entityType: 'verification_request',
    entityId: 'request-1', state: 'delivered', createdAt: new Date().toISOString(),
    seenAt: null, reviewOutcome: 'certified',
  },
  {
    id: 'notif-2', eventType: 'transaction_turn', entityType: 'transaction',
    entityId: 'txn-1', state: 'delivered', createdAt: new Date(Date.now() - 7200000).toISOString(),
    seenAt: '2026-09-29T10:00:00.000Z',
  },
];

describe('notification centre contract (MV1 X03)', () => {
  it('lists events by name with unread emphasis, never generic messages', async () => {
    await act(async () => {
      root.render(<NotificationCenterV13 notifications={inbox} state="idle" error="" onOpen={() => undefined} onClose={() => undefined} />);
    });
    const text = container.textContent ?? '';
    expect(text).toContain('Lieu vérifié');
    expect(text).toContain('Tour de transaction');
    expect(container.querySelectorAll('button.pitem').length).toBe(2);
  });

  it('opens the event target on tap, carrying the notification for seen-marking', async () => {
    const onOpen = vi.fn();
    await act(async () => {
      root.render(<NotificationCenterV13 notifications={inbox} state="idle" error="" onOpen={onOpen} onClose={() => undefined} />);
    });
    const first = container.querySelector('button.pitem');
    await act(async () => {
      first?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen.mock.calls[0][0]).toMatchObject({ id: 'notif-1' });
    expect(onOpen.mock.calls[0][1]).toEqual({ kind: 'claim-request', requestId: 'request-1' });
  });

  it('states loading, error and empty honestly', async () => {
    await act(async () => {
      root.render(<NotificationCenterV13 notifications={[]} state="loading" error="" onOpen={() => undefined} onClose={() => undefined} />);
    });
    // Le chargement montre la FORME du contenu (squelette), pas un mot.
    expect(container.querySelector('.skeleton')).not.toBeNull();
    await act(async () => {
      root.render(<NotificationCenterV13 notifications={[]} state="error" error="Panne." onOpen={() => undefined} onClose={() => undefined} />);
    });
    expect(container.textContent).toContain('Panne.');
    await act(async () => {
      root.render(<NotificationCenterV13 notifications={[]} state="idle" error="" onOpen={() => undefined} onClose={() => undefined} />);
    });
    expect(container.textContent).toContain('Aucune activité');
  });
});
