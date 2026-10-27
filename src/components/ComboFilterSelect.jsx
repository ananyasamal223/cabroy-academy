import { useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export default function ComboFilterSelect({ label, icon: Icon, value, options, onChange }) {
  const id = useId();
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const choose = (index) => {
    onChange(options[index].value);
    setOpen(false);
    triggerRef.current.focus();
  };
  const handleKeyDown = (event) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
      const current = open ? activeIndex : selectedIndex;
      const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1
        : !open ? selectedIndex : (current + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
      setActiveIndex(next);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) choose(activeIndex);
      else { setActiveIndex(selectedIndex); setOpen(true); }
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const index = options.findIndex((option) => option.label.toLowerCase().startsWith(event.key.toLowerCase()));
      if (index !== -1) { setActiveIndex(index); setOpen(true); }
    }
  };

  return (
    <div className="cc-select" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <button ref={triggerRef} type="button" className={`cc-select-trigger ${open ? "is-open" : ""}`}
        role="combobox" aria-label={label} aria-haspopup="listbox" aria-expanded={open}
        aria-controls={`${id}-options`} aria-activedescendant={open ? `${id}-option-${activeIndex}` : undefined}
        onKeyDown={handleKeyDown} onClick={() => { setActiveIndex(selectedIndex); setOpen(!open); }}>
        <Icon size={21} aria-hidden="true" /><span>{options[selectedIndex].label}</span><ChevronDown size={17} aria-hidden="true" />
      </button>
      {open && <ul id={`${id}-options`} className="cc-select-options" role="listbox" aria-label={label}>
        {options.map((option, index) => <li key={option.value} id={`${id}-option-${index}`} role="option"
          aria-selected={option.value === value} className={index === activeIndex ? "is-active" : ""}
          onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(index)}>
          <span>{option.label}</span>{option.value === value && <Check size={17} aria-hidden="true" />}
        </li>)}
      </ul>}
    </div>
  );
}
