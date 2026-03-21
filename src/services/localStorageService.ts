import type { XpEvent } from '../types/index.ts';

const XP_KEY = 'xpEvents';

function readEvents(): XpEvent[] {
  const raw = localStorage.getItem(XP_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as XpEvent[];
}

function writeEvents(events: XpEvent[]): void {
  localStorage.setItem(XP_KEY, JSON.stringify(events));
}

export const localStorageXpService = {
  async getXpEvents(): Promise<XpEvent[]> {
    return readEvents();
  },

  async saveXpEvent(event: XpEvent): Promise<XpEvent> {
    const events = readEvents();
    events.push(event);
    writeEvents(events);
    return event;
  },

  async deleteXpEventsBySourceId(sourceId: string): Promise<void> {
    const events = readEvents();
    writeEvents(events.filter((e) => e.sourceId !== sourceId));
  },
};
