'use client';

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  id?: string;
};

export function ToggleSwitch({ checked, onChange, label, id }: ToggleSwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle-btn ${checked ? 'on' : 'off'}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-knob" />
    </button>
  );
}
