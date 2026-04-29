import React from 'react';
import { TimerConfig } from '../../types';
import { Save, RefreshCcw, Cat } from 'lucide-react';

interface SettingsDialogProps {
  config: TimerConfig;
  onUpdate: (config: TimerConfig) => void;
}

const DURATION_ITEMS = [
  { key: 'work', label: 'Work Duration', desc: 'Typical focus session length' },
  { key: 'shortBreak', label: 'Short Break', desc: 'Rest after one session' },
  { key: 'longBreak', label: 'Long Break', desc: 'Extended rest after few sessions' }
] as const;

const COLOR_PRESETS = [
  { name: 'Cat Orange', value: '#FF8C42' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Ocean', value: '#0ea5e9' },
  { name: 'Forest', value: '#10b981' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Warm', value: '#f97316' },
];

export function SettingsDialog({ config, onUpdate }: SettingsDialogProps) {
  const [localConfig, setLocalConfig] = React.useState(config);

  const handleChange = (key: keyof TimerConfig, value: string | number) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    const defaultConfig = { work: 25, shortBreak: 5, longBreak: 15, themeColor: '#FF8C42' };
    setLocalConfig(defaultConfig);
    onUpdate(defaultConfig);
  };

  return (
    <div className="space-y-6 pb-24 xl:pb-0">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Timer Settings</h2>
          <p className="mt-1 text-sm text-zinc-500">Tune durations and visual tone for desktop focus sessions.</p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-xs font-bold text-zinc-400 transition-colors hover:text-zinc-900"
        >
          <RefreshCcw className="h-3 w-3" /> Reset Defaults
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:grid-rows-[repeat(3,minmax(0,1fr))_auto] xl:items-stretch">
        {DURATION_ITEMS.map((item, index) => (
          <div
            key={item.key}
            className="rounded-[1.6rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 xl:min-h-[214px]"
            style={{ gridColumn: '1 / 2', gridRow: `${index + 1} / ${index + 2}` }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{item.label}</label>
                <p className="text-xs text-zinc-500">{item.desc}</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={localConfig[item.key as keyof TimerConfig] as number}
                  onChange={(e) => handleChange(item.key as keyof TimerConfig, parseInt(e.target.value, 10) || 1)}
                  className="w-20 rounded-xl border-zinc-200 bg-zinc-50 px-4 py-2 text-center font-mono font-black transition-all focus:ring-2 dark:border-zinc-700 dark:bg-zinc-800"
                  style={{ '--tw-ring-color': localConfig.themeColor } as React.CSSProperties}
                />
                <span className="text-xs font-bold text-zinc-400">MIN</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="120"
              value={localConfig[item.key as keyof TimerConfig] as number}
              onChange={(e) => handleChange(item.key as keyof TimerConfig, parseInt(e.target.value, 10) || 1)}
              className="h-1.5 w-full appearance-none rounded-lg bg-zinc-100 cursor-pointer dark:bg-zinc-800"
              style={{ accentColor: localConfig.themeColor }}
            />
          </div>
        ))}

        <div className="rounded-[1.6rem] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 xl:col-start-2 xl:row-[1_/_3] xl:h-full">
          <div className="mb-4">
            <label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Theme Color</label>
            <p className="text-xs text-zinc-500">Pick the mood of your focus session</p>
          </div>

          <div className="mb-5 grid grid-cols-3 gap-3">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color.value}
                onClick={() => handleChange('themeColor', color.value)}
                className="h-14 rounded-2xl border-2 transition-transform hover:scale-[1.03] active:scale-95"
                style={{
                  backgroundColor: color.value,
                  borderColor: localConfig.themeColor === color.value ? (localConfig.themeColor === '#FF8C42' ? '#000' : 'white') : 'transparent',
                  boxShadow: localConfig.themeColor === color.value ? `0 0 0 2px ${color.value}40` : 'none'
                }}
                title={color.name}
              />
            ))}
          </div>

          <div className="flex items-center gap-3 rounded-[1.4rem] border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg"
              style={{ backgroundColor: localConfig.themeColor }}
            >
              <Cat className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={localConfig.themeColor}
                onChange={(e) => handleChange('themeColor', e.target.value)}
                className="w-full border-none bg-transparent p-0 text-sm font-mono font-black focus:ring-0"
              />
            </div>
            <input
              type="color"
              value={localConfig.themeColor}
              onChange={(e) => handleChange('themeColor', e.target.value)}
              className="h-8 w-8 cursor-pointer rounded-lg border-none bg-transparent p-0"
            />
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 xl:col-start-2 xl:row-start-3 xl:h-full">
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Preview</p>
          <div className="mt-4 flex h-[calc(100%-2rem)] flex-col rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
            <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-400">Focus Block</div>
            <div className="mt-4 text-[3.4rem] font-black leading-none tracking-tight text-zinc-900 dark:text-zinc-100">
              {String(localConfig.work).padStart(2, '0')}:00
            </div>
            <button
              type="button"
              className="mt-auto w-full rounded-2xl px-4 py-3 text-sm font-black text-white shadow-sm"
              style={{ backgroundColor: localConfig.themeColor }}
            >
              Start Focus
            </button>
          </div>
        </div>

        <button
          onClick={() => onUpdate(localConfig)}
          className="flex w-full items-center justify-center gap-2 rounded-[1.6rem] py-4 text-lg font-black text-white shadow-xl shadow-zinc-900/10 transition-all hover:scale-[1.01] active:scale-[0.98] xl:col-start-2 xl:row-start-4"
          style={{ backgroundColor: localConfig.themeColor }}
        >
          <Save className="h-5 w-5" /> Save Configuration
        </button>
      </div>
    </div>
  );
}
