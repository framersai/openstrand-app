import { EventEmitter } from 'events';

class AppEventBus extends EventEmitter {
  emitAsync(event: string, data: any): Promise<void[]> {
    const listeners = this.listeners(event);
    return Promise.all(listeners.map(fn => {
        try {
            const result = fn(data);
            return result instanceof Promise ? result : Promise.resolve(result);
        } catch (e) {
            console.error('Event handler error:', e);
            return Promise.resolve();
        }
    }));
  }
}

export const appEvents = new AppEventBus();

