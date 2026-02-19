import React from 'react';
import Select from 'react-select';

export default function SelectField({
    label,
    value,          // objeto {value,label} ou null
    onChange,       // recebe objeto ou null
    options = [],   // array de {value,label}
    placeholder = 'Selecione...',
    error,
    isClearable = true,
    isSearchable = true,
    isDisabled = false,
}) {
    const styles = {
        control: (base, state) => ({
            ...base,
            minHeight: 40,
            borderRadius: 10,
            borderColor: error
                ? 'hsl(var(--destructive))'
                : state.isFocused
                    ? 'hsl(var(--primary))'
                    : 'hsl(var(--input))',
            boxShadow: state.isFocused ? '0 0 0 2px hsl(var(--ring) / 0.15)' : 'none',
            backgroundColor: 'white',
            paddingLeft: 2,
            paddingRight: 2,
            cursor: isDisabled ? 'not-allowed' : 'default',
            ':hover': {
                borderColor: state.isFocused ? 'hsl(var(--primary))' : 'hsl(var(--input))',
            },
        }),
        valueContainer: (base) => ({ ...base, padding: '0 8px' }),
        placeholder: (base) => ({
            ...base,
            color: 'hsl(var(--muted-foreground))',
            fontSize: 14,
        }),
        input: (base) => ({ ...base, fontSize: 14, color: 'hsl(var(--foreground))' }),
        singleValue: (base) => ({ ...base, fontSize: 14, color: 'hsl(var(--foreground))' }),
        menu: (base) => ({
            ...base,
            borderRadius: 14,
            overflow: 'hidden',
            zIndex: 50,
            border: `1px solid hsl(var(--border))`,
            boxShadow: '0 18px 34px rgba(0,0,0,.12)',
        }),
        menuList: (base) => ({ ...base, padding: 6, maxHeight: 260 }),
        option: (base, state) => ({
            ...base,
            borderRadius: 12,
            padding: '10px 10px',
            fontSize: 14,
            backgroundColor: state.isSelected
                ? 'hsl(var(--primary) / 0.14)'
                : state.isFocused
                    ? 'hsl(var(--primary) / 0.10)'   // hover laranja clarinho
                    : 'transparent',
            color: state.isSelected ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
            cursor: 'pointer',
            ':active': { backgroundColor: 'hsl(var(--primary) / 0.16)' },
        }),


        indicatorSeparator: () => ({ display: 'none' }),
        dropdownIndicator: (base, state) => ({
            ...base,
            color: state.isFocused ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
            ':hover': { color: 'hsl(var(--primary))' },
        }),
        clearIndicator: (base) => ({
            ...base,
            color: 'hsl(var(--muted-foreground))',
            ':hover': { color: 'hsl(var(--foreground))' },
        }),
    };

    return (
        <div>
            {label && (
                <label className="block text-sm font-medium text-foreground mb-1.5">
                    {label}
                </label>
            )}

            <Select
                value={value}
                onChange={onChange}
                options={options}
                placeholder={placeholder}
                isClearable={isClearable}
                isSearchable={isSearchable}
                isDisabled={isDisabled}
                styles={styles}
            />

            {error && <span className="text-sm text-destructive mt-1 block">{error}</span>}
        </div>
    );
}
