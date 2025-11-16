/**
 * Voice Controls Storybook Stories
 * 
 * Interactive documentation for voice components.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { VoiceSettingsPanel } from '../settings/VoiceSettingsPanel';
import { ContentNarrator } from '../reader/ContentNarrator';
import { QuickVoiceCapture } from '../capture/QuickVoiceCapture';
import { ScreenReaderStudyMode } from '../accessibility/ScreenReaderStudyMode';
import { VoiceQuotaMonitor } from './VoiceQuotaMonitor';
import { haptic } from '@/lib/haptics';

// ============================================================================
// Voice Settings Panel
// ============================================================================

const VoiceSettingsMeta: Meta<typeof VoiceSettingsPanel> = {
  title: 'Voice/Settings Panel',
  component: VoiceSettingsPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Comprehensive voice settings UI with TTS/STT provider selection, voice customization, and privacy controls.',
      },
    },
  },
  tags: ['autodocs'],
};

export default VoiceSettingsMeta;

type VoiceSettingsStory = StoryObj<typeof VoiceSettingsPanel>;

export const Default: VoiceSettingsStory = {
  args: {},
};

// ============================================================================
// Content Narrator
// ============================================================================

const ContentNarratorMeta: Meta<typeof ContentNarrator> = {
  title: 'Voice/Content Narrator',
  component: ContentNarrator,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Floating audio player for narrating long-form content (strands, journals). Features progress bar, speed controls, and keyboard shortcuts.',
      },
    },
  },
  tags: ['autodocs'],
};

export const ContentNarratorDefault: StoryObj<typeof ContentNarrator> = {
  args: {
    content: 'This is a sample content that will be narrated. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    title: 'Sample Strand',
    voice: 'alloy',
    autoStart: false,
  },
};

export const ContentNarratorLongForm: StoryObj<typeof ContentNarrator> = {
  args: {
    content: `# Introduction to Quantum Computing

Quantum computing represents a paradigm shift in computational capabilities. Unlike classical computers that use bits (0 or 1), quantum computers use quantum bits or qubits that can exist in superposition states.

## Key Concepts

1. **Superposition**: A qubit can be in multiple states simultaneously until measured.
2. **Entanglement**: Qubits can be correlated in ways that have no classical analogue.
3. **Quantum Gates**: Operations that manipulate qubit states.

This technology promises to revolutionize fields like cryptography, drug discovery, and optimization problems.`,
    title: 'Quantum Computing Lecture',
    voice: 'nova',
    autoStart: false,
  },
};

// ============================================================================
// Quick Voice Capture
// ============================================================================

const QuickVoiceCaptureMeta: Meta<typeof QuickVoiceCapture> = {
  title: 'Voice/Quick Capture',
  component: QuickVoiceCapture,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Mobile-optimized hold-to-talk button for quick voice notes. Features haptic feedback and auto-strand creation.',
      },
    },
  },
  tags: ['autodocs'],
};

export const QuickCaptureDefault: StoryObj<typeof QuickVoiceCapture> = {
  args: {
    autoCreateStrand: false,
    onCapture: (transcript) => {
      console.log('Captured:', transcript);
      alert(`Captured: ${transcript}`);
    },
  },
};

export const QuickCaptureAutoSave: StoryObj<typeof QuickVoiceCapture> = {
  args: {
    autoCreateStrand: true,
    onCapture: (transcript) => console.log('Captured:', transcript),
    onSaveStrand: async (title, content) => {
      console.log('Saving strand:', { title, content });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(`Strand saved: "${title}"`);
    },
  },
};

// ============================================================================
// Screen-Reader Study Mode
// ============================================================================

const ScreenReaderStudyModeMeta: Meta<typeof ScreenReaderStudyMode> = {
  title: 'Voice/Screen-Reader Study Mode',
  component: ScreenReaderStudyMode,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Accessible study mode with auto-narration and keyboard-only controls. Optimized for screen readers.',
      },
    },
  },
  tags: ['autodocs'],
};

const sampleFlashcards = [
  {
    id: '1',
    front: 'What is a qubit?',
    back: 'A quantum bit - the basic unit of quantum information',
    hint: 'Think quantum + bit',
  },
  {
    id: '2',
    front: 'What is superposition?',
    back: 'The ability of a quantum system to be in multiple states simultaneously',
  },
  {
    id: '3',
    front: 'What is entanglement?',
    back: 'A quantum phenomenon where particles become correlated',
    hint: 'Einstein called it "spooky action at a distance"',
  },
];

export const ScreenReaderDefault: StoryObj<typeof ScreenReaderStudyMode> = {
  args: {
    flashcards: sampleFlashcards,
    autoNarrate: true,
    onRate: (id, rating) => console.log('Rated:', id, rating),
    onComplete: () => alert('Session complete!'),
  },
};

// ============================================================================
// Voice Quota Monitor
// ============================================================================

const VoiceQuotaMonitorMeta: Meta<typeof VoiceQuotaMonitor> = {
  title: 'Voice/Quota Monitor',
  component: VoiceQuotaMonitor,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Persistent floating widget that shows voice quota usage with warnings.',
      },
    },
  },
  tags: ['autodocs'],
};

export const QuotaMonitor: StoryObj<typeof VoiceQuotaMonitor> = {
  args: {},
};

// ============================================================================
// Haptics Demo
// ============================================================================

export const HapticsDemo: StoryObj = {
  render: () => (
    <div className="space-y-4 p-8">
      <h2 className="text-2xl font-bold">Haptic Feedback Demo</h2>
      <p className="text-muted-foreground">
        Test different haptic patterns (requires mobile device or haptic-enabled browser)
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <button
          onClick={() => haptic.light()}
          className="p-4 border rounded-lg hover:bg-accent"
        >
          Light Tap
        </button>

        <button
          onClick={() => haptic.medium()}
          className="p-4 border rounded-lg hover:bg-accent"
        >
          Medium Tap
        </button>

        <button
          onClick={() => haptic.heavy()}
          className="p-4 border rounded-lg hover:bg-accent"
        >
          Heavy Tap
        </button>

        <button
          onClick={() => haptic.success()}
          className="p-4 border rounded-lg hover:bg-accent bg-green-50"
        >
          Success Pattern
        </button>

        <button
          onClick={() => haptic.warning()}
          className="p-4 border rounded-lg hover:bg-accent bg-yellow-50"
        >
          Warning Pattern
        </button>

        <button
          onClick={() => haptic.error()}
          className="p-4 border rounded-lg hover:bg-accent bg-red-50"
        >
          Error Pattern
        </button>

        <button
          onClick={() => haptic.selection()}
          className="p-4 border rounded-lg hover:bg-accent"
        >
          Selection
        </button>

        <button
          onClick={() => haptic.pattern([50, 100, 50, 100, 50])}
          className="p-4 border rounded-lg hover:bg-accent"
        >
          Custom Pattern
        </button>
      </div>

      <div className="mt-4 p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium">Status:</p>
        <p className="text-sm text-muted-foreground">
          Supported: {haptic.isDeviceSupported() ? 'Yes ✅' : 'No ❌'}
        </p>
        <p className="text-sm text-muted-foreground">
          Enabled: {haptic.isHapticsEnabled() ? 'Yes ✅' : 'No ❌'}
        </p>
      </div>
    </div>
  ),
};

HapticsDemo.parameters = {
  layout: 'padded',
};

