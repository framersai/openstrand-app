/**
 * Voice Notifications
 * 
 * TTS-powered spoken notifications for Pomodoro, achievements, and alerts.
 * 
 * @example
 * ```typescript
 * import { voiceNotify } from '@/lib/voice-notifications';
 * 
 * await voiceNotify('pomodoro', 'Session complete! Time for a break.');
 * ```
 */

interface NotificationConfig {
  text: string;
  voice?: string;
  speed?: number;
  priority?: 'low' | 'normal' | 'high';
}

class VoiceNotificationService {
  private audioQueue: NotificationConfig[] = [];
  private isPlaying = false;
  private enabled = true;

  constructor() {
    // Check user preferences
    if (typeof window !== 'undefined') {
      const savedPref = localStorage.getItem('voiceNotificationsEnabled');
      this.enabled = savedPref === null ? true : savedPref === 'true';
    }
  }

  /**
   * Play voice notification
   */
  async notify(type: string, config: NotificationConfig): Promise<void> {
    if (!this.enabled) return;

    // Add to queue
    this.audioQueue.push(config);

    // Process queue
    if (!this.isPlaying) {
      await this.processQueue();
    }
  }

  /**
   * Process notification queue
   */
  private async processQueue(): Promise<void> {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const notification = this.audioQueue.shift()!;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        // Use browser TTS fallback
        this.speakBrowser(notification.text);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/voice/tts/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: notification.text,
            voice: notification.voice || 'alloy',
            speed: notification.speed || 1.0,
          }),
        }
      );

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        await new Promise<void>((resolve) => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            resolve();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            resolve();
          };
          audio.play();
        });
      }
    } catch (error) {
      console.error('Voice notification failed:', error);
      // Fallback to browser TTS
      this.speakBrowser(notification.text);
    } finally {
      // Process next in queue
      setTimeout(() => this.processQueue(), 500);
    }
  }

  /**
   * Browser TTS fallback (Web Speech API)
   */
  private speakBrowser(text: string): void {
    if (!('speechSynthesis' in window)) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Enable/disable notifications
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('voiceNotificationsEnabled', String(enabled));
    }

    if (!enabled) {
      // Clear queue
      this.audioQueue = [];
      this.isPlaying = false;
    }
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Singleton instance
export const voiceNotificationService = new VoiceNotificationService();

/**
 * Quick helper functions for common notifications
 */

export async function voiceNotifyPomodoroComplete(): Promise<void> {
  await voiceNotificationService.notify('pomodoro', {
    text: 'Session complete! Great work. Time for a break.',
    priority: 'high',
  });
}

export async function voiceNotifyPomodoroBreakOver(): Promise<void> {
  await voiceNotificationService.notify('pomodoro', {
    text: 'Break time is over. Ready for another session?',
    priority: 'normal',
  });
}

export async function voiceNotifyBadgeEarned(badgeName: string): Promise<void> {
  await voiceNotificationService.notify('badge', {
    text: `Congratulations! You earned the ${badgeName} badge!`,
    priority: 'high',
  });
}

export async function voiceNotifyStreakMilestone(days: number): Promise<void> {
  await voiceNotificationService.notify('streak', {
    text: `Amazing! You've reached a ${days} day study streak!`,
    priority: 'high',
  });
}

export async function voiceNotifyQuotaWarning(percentage: number): Promise<void> {
  await voiceNotificationService.notify('quota', {
    text: `You've used ${percentage}% of your daily voice quota.`,
    priority: 'normal',
  });
}

export async function voiceNotifyQuotaExceeded(): Promise<void> {
  await voiceNotificationService.notify('quota', {
    text: 'Daily voice quota exceeded. Upgrade your plan or wait until tomorrow.',
    priority: 'high',
  });
}

