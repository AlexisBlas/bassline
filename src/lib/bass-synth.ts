import { midiToFrequency } from "./music";

export const BASE_STEP_SECONDS = 0.42;

export interface PlaybackSettings {
  speed: number;
  loop: boolean;
  reverse: boolean;
}

type AudioContextConstructor = typeof AudioContext;

function getAudioContextClass(): AudioContextConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext
  );
}

/**
 * Plays one synth-bass pluck: a sawtooth plus a sine an octave below, through a
 * lowpass that sweeps 900 → 300 Hz, with a short pluck envelope.
 */
function pluck(ctx: AudioContext, destination: AudioNode, midi: number, duration: number) {
  const now = ctx.currentTime;
  const frequency = midiToFrequency(midi);
  const length = Math.min(Math.max(duration * 0.95, 0.15), 0.6);

  const saw = ctx.createOscillator();
  saw.type = "sawtooth";
  saw.frequency.setValueAtTime(frequency, now);

  const sub = ctx.createOscillator();
  sub.type = "sine";
  sub.frequency.setValueAtTime(frequency / 2, now);

  const subGain = ctx.createGain();
  subGain.gain.setValueAtTime(0.9, now);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.setValueAtTime(4, now);
  filter.frequency.setValueAtTime(900, now);
  filter.frequency.exponentialRampToValueAtTime(300, now + length * 0.6);

  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.exponentialRampToValueAtTime(0.55, now + 0.008);
  amp.gain.exponentialRampToValueAtTime(0.25, now + 0.08);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + length);

  saw.connect(filter);
  sub.connect(subGain).connect(filter);
  filter.connect(amp).connect(destination);

  saw.start(now);
  sub.start(now);
  saw.stop(now + length + 0.05);
  sub.stop(now + length + 0.05);
  saw.onended = () => {
    amp.disconnect();
    filter.disconnect();
    subGain.disconnect();
  };
}

/**
 * Steps through a MIDI sequence with a timer loop. Settings are read on every
 * step, so speed, loop and reverse changes apply while playing.
 */
export class ScalePlayer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private sequence: number[] = [];
  private position = 0;
  private settings: PlaybackSettings = { speed: 1, loop: false, reverse: false };

  constructor(
    private readonly onStep: (noteIndex: number | null) => void,
    private readonly onEnd: () => void = () => {},
  ) {}

  get playing(): boolean {
    return this.timer !== null;
  }

  /** Starts playing an ascending MIDI sequence. Must be called from a user gesture. */
  play(ascending: readonly number[], settings: PlaybackSettings) {
    this.stopTimer();
    const AudioCtx = getAudioContextClass();
    if (!AudioCtx || ascending.length === 0) return;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.7;
      this.master.connect(this.ctx.destination);
    }
    void this.ctx.resume();

    this.sequence = [...ascending];
    this.settings = { ...settings };
    this.position = 0;
    this.tick();
  }

  update(settings: PlaybackSettings) {
    if (settings.reverse !== this.settings.reverse && this.position > 0) {
      // Continue from the note that is sounding, heading the other way.
      const last = this.sequence.length;
      const current = this.settings.reverse ? last - this.position : this.position - 1;
      this.position = settings.reverse ? last - current : current + 1;
    }
    this.settings = { ...settings };
  }

  stop() {
    const wasPlaying = this.playing;
    this.stopTimer();
    if (wasPlaying) {
      this.onStep(null);
      this.onEnd();
    }
  }

  dispose() {
    this.stopTimer();
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
  }

  private stopTimer() {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }

  private tick = () => {
    if (!this.ctx || !this.master) return;
    const { speed, loop, reverse } = this.settings;

    if (this.position >= this.sequence.length) {
      if (!loop) {
        this.timer = null;
        this.onStep(null);
        this.onEnd();
        return;
      }
      this.position = 0;
    }

    const index = reverse ? this.sequence.length - 1 - this.position : this.position;
    const midi = this.sequence[index];
    const stepSeconds = BASE_STEP_SECONDS / Math.min(Math.max(speed, 0.25), 2);

    pluck(this.ctx, this.master, midi, stepSeconds);
    this.onStep(midi % 12);
    this.position++;
    this.timer = setTimeout(this.tick, stepSeconds * 1000);
  };
}
