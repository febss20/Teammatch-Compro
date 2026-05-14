"use client";

import { useRef, useState } from "react";
import { validateCustomSkill, normalizeText } from "@/lib/profile/normalization";

interface ChipInputProps {
    name: string;
    label: string;
    placeholder?: string;
    maxItems?: number;
    currentCount?: number;
    disabled?: boolean;
    defaultItems?: string[];
    errorMessage?: string | null;
    onItemsChange?: (items: string[]) => void;
    helperText?: string;
}

export function ChipInput({
    name,
    label,
    placeholder = "Ketik lalu tekan Enter...",
    maxItems = 5,
    currentCount = 0,
    disabled = false,
    defaultItems = [],
    errorMessage,
    onItemsChange,
    helperText,
}: ChipInputProps) {
    const [items, setItems] = useState<string[]>(defaultItems);
    const [input, setInput] = useState("");
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const totalItems = currentCount + items.length;
    const canAdd = totalItems < maxItems;
    const limitMessage = `Maksimal ${maxItems} item. Hapus salah satu untuk menambahkan item lain.`;

    const handleAddItem = () => {
        const trimmed = input.trim();
        if (!trimmed) {
            setError("Tidak boleh kosong");
            return;
        }

        const normalized = normalizeText(trimmed);
        const validation = validateCustomSkill(trimmed);

        if (!validation.valid) {
            setError(validation.error ?? "Input tidak valid");
            return;
        }

        const isDuplicate = items.some((item) => normalizeText(item) === normalized);
        if (isDuplicate) {
            setError("Item sudah ditambahkan");
            return;
        }

        if (!canAdd) {
            setError(limitMessage);
            return;
        }

        const newItems = [...items, trimmed];
        setItems(newItems);
        setInput("");
        setError(null);
        onItemsChange?.(newItems);
        inputRef.current?.focus();
    };

    const handleRemoveItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        onItemsChange?.(newItems);
        setError(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            handleAddItem();
        }
    };

    return (
        <div className="grid gap-3">
            <div className="flex items-end justify-between gap-2">
                <label className="brutal-label">{label}</label>
                <span className="text-sm text-[var(--tm-muted)]">
                    {totalItems}/{maxItems}
                </span>
            </div>

            <div className="grid gap-2">
                <div className="flex flex-wrap gap-2">
                    {items.map((item, index) => (
                        <div key={index} className="brutal-chip flex items-center gap-2 bg-[var(--tm-accent-2)] px-3 py-2">
                            <span className="text-sm font-medium">{item}</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                disabled={disabled}
                                className="text-base leading-none hover:opacity-70"
                                aria-label={`Hapus ${item}`}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={placeholder}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            setError(null);
                        }}
                        onKeyDown={handleKeyDown}
                        disabled={disabled || !canAdd}
                        className="brutal-input"
                    />
                    <button
                        type="button"
                        onClick={handleAddItem}
                        disabled={disabled || !canAdd || !input.trim()}
                        className="brutal-button"
                    >
                        Tambah
                    </button>
                </div>
            </div>

            {(error || errorMessage) && (
                <p className="text-sm font-semibold text-[var(--tm-danger)]">{error ?? errorMessage}</p>
            )}
            {!canAdd && !error && !errorMessage && (
                <p className="text-sm font-semibold text-[var(--tm-muted)]">{limitMessage}</p>
            )}
            {helperText && canAdd && <p className="text-sm text-[var(--tm-muted)]">{helperText}</p>}

            {/* Hidden inputs for form submission */}
            {items.map((item, index) => (
                <input key={index} type="hidden" name={name} value={item} />
            ))}
        </div>
    );
}
