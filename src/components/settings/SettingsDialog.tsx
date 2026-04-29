import React from 'react';
import { TimerConfig } from '../../types';
import { Save, RefreshCcw, Cat } from 'lucide-react';

interface SettingsDialogProps {
  config: TimerConfig;
  onUpdate: (config: TimerConfig) => void;
}

export function SettingsDialog({ config, onUpdate }: SettingsDialogProps) {
  const [localConfig, setLocalConfig] = React.useState(config);

  const handleChange = (key: keyof TimerConfig, value: string | number) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    const default_ = { work: 25, shortBreak: 5, longBreak: 15, themeColor: '#FF8C42' };
    setLocalConfig(default_);
    onUpdate(default_);
  };

  const colorPresets = [
    { name: 'Cat Orange', value: '#FF8C42' },
    { name: 'Rose', value: '#e11d48' },
    { name: 'Ocean', value: '#0ea5e9' },
    { name: 'Forest', value: '#10b981' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Warm', value: '#f97316' },
  ];

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Timer Settings</h2>
        <button 
          onClick={handleReset}
          className="text-xs font-bold text-zinc-400 hover:text-zinc-900 flex items-center gap-1 transition-colors"
        >
          <RefreshCcw className="w-3 h-3" /> Reset Defaults
        </button>
      </div>

      <div className="grid gap-6">
        {[
          { key: 'work', label: 'Work Duration', desc: 'Typical focus session length' },
          { key: 'shortBreak', label: 'Short Break', desc: 'Rest after one session' },
          { key: 'longBreak', label: 'Long Break', desc: 'Extended rest after few sessions' }
        ].map((item) => (
          <div key={item.key} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
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
                  onChange={(e) => handleChange(item.key as keyof TimerConfig, parseInt(e.target.value) || 1)}
                  className="w-20 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-center font-black focus:ring-2 transition-all font-mono"
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
              onChange={(e) => handleChange(item.key as keyof TimerConfig, parseInt(e.target.value) || 1)}
              className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: localConfig.themeColor }}
            />
          </div>
        ))}

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="mb-4">
            <label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Theme Color</label>
            <p className="text-xs text-zinc-500">Pick the mood of your focus session</p>
          </div>
          
          <div className="flex flex-wrap gap-3 mb-6">
            {colorPresets.map((color) => (
              <button
                key={color.value}
                onClick={() => handleChange('themeColor', color.value)}
                className="w-10 h-10 rounded-xl border-2 transition-all hover:scale-110 active:scale-95"
                style={{ 
                  backgroundColor: color.value,
                  borderColor: localConfig.themeColor === color.value ? (localConfig.themeColor === '#FF8C42' ? '#000' : 'white') : 'transparent',
                  boxShadow: localConfig.themeColor === color.value ? `0 0 0 2px ${color.value}40` : 'none'
                }}
                title={color.name}
              />
            ))}
          </div>

          <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
            <div 
              className="w-12 h-12 rounded-xl shadow-lg flex items-center justify-center text-white"
              style={{ backgroundColor: localConfig.themeColor }}
            >
              <Cat className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <input 
                type="text" 
                value={localConfig.themeColor}
                onChange={(e) => handleChange('themeColor', e.target.value)}
                className="w-full bg-transparent border-none p-0 text-sm font-mono font-black focus:ring-0"
              />
            </div>
            <input 
              type="color" 
              value={localConfig.themeColor}
              onChange={(e) => handleChange('themeColor', e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none p-0"
            />
          </div>
        </div>

        <button
          onClick={() => onUpdate(localConfig)}
          className="w-full py-4 rounded-3xl font-black text-lg shadow-xl shadow-zinc-900/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-white"
          style={{ backgroundColor: localConfig.themeColor }}
        >
          <Save className="w-5 h-5" /> Save Configuration
        </button>
      </div>
    </div>
  );
}
