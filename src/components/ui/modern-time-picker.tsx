'use client';

import React, { useRef, useState, useEffect, useLayoutEffect, useCallback, useId, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronUp, ChevronDown, X } from 'lucide-react';
import { cn } from '@/shared/utils';

interface TimeDigitPickerProps {
    value: number;
    max: number;
    label: string;
    onIncrement: () => void;
    onDecrement: () => void;
    onChange: (value: number) => void;
}

export interface ModernTimePickerProps {
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    /** Portal target when inside a Radix Dialog — pass the dialog content element. Auto-detected if omitted. */
    portalContainer?: HTMLElement | DocumentFragment | null;
}

const stepBtnClass =
    'rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:rounded-lg sm:p-1.5';

const DROPDOWN_WIDTH_LG = 380;
const DROPDOWN_WIDTH_MD = 340;
const DROPDOWN_WIDTH_SM = 280;
const VIEWPORT_EDGE_PADDING = 16;

function getDropdownWidth(): number {
    if (typeof window === 'undefined') return DROPDOWN_WIDTH_LG;

    const viewportWidth = window.innerWidth;
    if (viewportWidth < 640) {
        return Math.min(DROPDOWN_WIDTH_SM, viewportWidth - VIEWPORT_EDGE_PADDING * 2);
    }
    if (viewportWidth < 768) {
        return DROPDOWN_WIDTH_MD;
    }
    return DROPDOWN_WIDTH_LG;
}

function clampDropdownLeft(left: number, dropdownWidth: number): number {
    if (typeof window === 'undefined') return left;

    const maxLeft = window.innerWidth - dropdownWidth - VIEWPORT_EDGE_PADDING;
    return Math.max(VIEWPORT_EDGE_PADDING, Math.min(left, maxLeft));
}

function resolvePortalContainer(
    trigger: HTMLElement | null,
    explicit?: HTMLElement | DocumentFragment | null,
): { container: HTMLElement | DocumentFragment; mode: 'fixed' | 'absolute'; anchor: HTMLElement | null } {
    if (explicit) {
        return {
            container: explicit,
            mode: explicit instanceof HTMLElement && explicit !== document.body ? 'absolute' : 'fixed',
            anchor: explicit instanceof HTMLElement ? explicit : null,
        };
    }

    // Inside a Radix dialog: portal into the dialog shell so clicks are not blocked by the modal layer.
    const dialogContent = trigger?.closest('[role="dialog"]');
    if (dialogContent instanceof HTMLElement) {
        return {
            container: dialogContent,
            mode: 'absolute',
            anchor: dialogContent,
        };
    }

    return { container: document.body, mode: 'fixed', anchor: null };
}

function computeDropdownPosition(
    trigger: HTMLElement,
    mode: 'fixed' | 'absolute',
    anchor: HTMLElement | null,
    dropdownWidth: number,
) {
    const triggerRect = trigger.getBoundingClientRect();
    const centeredLeft = triggerRect.left + (triggerRect.width - dropdownWidth) / 2;

    if (mode === 'absolute' && anchor) {
        const anchorRect = anchor.getBoundingClientRect();
        return {
            top: triggerRect.bottom - anchorRect.top + 8,
            left: clampDropdownLeft(centeredLeft, dropdownWidth) - anchorRect.left,
        };
    }

    return {
        top: triggerRect.bottom + 8,
        left: clampDropdownLeft(centeredLeft, dropdownWidth),
    };
}

const stopPickerEvent = (e: React.SyntheticEvent) => {
    e.stopPropagation();
};

function TimeDigitPicker({ value, max, label, onIncrement, onDecrement, onChange }: TimeDigitPickerProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(String(value).padStart(2, '0'));
    const inputRef = useRef<HTMLInputElement>(null);
    const wheelRef = useRef<HTMLDivElement>(null);

    const onIncrementRef = useRef(onIncrement);
    const onDecrementRef = useRef(onDecrement);

    useEffect(() => {
        onIncrementRef.current = onIncrement;
        onDecrementRef.current = onDecrement;
    });

    useEffect(() => {
        if (!isEditing) {
            setEditValue(String(value).padStart(2, '0'));
        }
    }, [value, isEditing]);

    useEffect(() => {
        const element = wheelRef.current;
        if (!element) return;

        const onWheel = (e: globalThis.WheelEvent) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                onIncrementRef.current();
            } else {
                onDecrementRef.current();
            }
        };

        element.addEventListener('wheel', onWheel, { passive: false });

        return () => {
            element.removeEventListener('wheel', onWheel);
        };
    }, []);

    const handleClick = () => {
        setIsEditing(true);
        setTimeout(() => inputRef.current?.select(), 0);
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        if (val.length <= 2) {
            setEditValue(val);
        }
    };

    const handleBlur = () => {
        const numValue = parseInt(editValue) || 0;
        const clampedValue = Math.min(Math.max(numValue, 0), max);
        onChange(clampedValue);
        setIsEditing(false);
        setEditValue(String(clampedValue).padStart(2, '0'));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditValue(String(value).padStart(2, '0'));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            onIncrement();
            setIsEditing(false);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            onDecrement();
            setIsEditing(false);
        }
    };

    return (
        <div className="flex flex-col items-center">
            <button
                type="button"
                onPointerDown={stopPickerEvent}
                onClick={(e) => {
                    e.stopPropagation();
                    onIncrement();
                }}
                className={cn(stepBtnClass, 'mb-0.5 sm:mb-1')}
            >
                <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>

            <div className="relative">
                <div
                    ref={wheelRef}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border-2 border-border bg-card text-foreground shadow-sm transition-transform duration-200 hover:scale-105 sm:h-12 sm:w-12 sm:rounded-xl md:h-14 md:w-14"
                    onClick={handleClick}
                    onPointerDown={stopPickerEvent}
                    title="انقر للكتابة، استخدم عجلة الماوس للتغيير"
                >
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={editValue}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            className="h-8 w-8 bg-transparent text-center text-base font-bold tabular-nums text-foreground outline-none sm:h-9 sm:w-9 sm:text-lg md:h-10 md:w-10 md:text-xl"
                            maxLength={2}
                        />
                    ) : (
                        <span className="select-none text-base font-bold tabular-nums text-foreground sm:text-lg md:text-xl">
                            {String(value).padStart(2, '0')}
                        </span>
                    )}
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-medium text-muted-foreground sm:-bottom-5 sm:text-[10px]">
                    {label}
                </div>
            </div>

            <button
                type="button"
                onPointerDown={stopPickerEvent}
                onClick={(e) => {
                    e.stopPropagation();
                    onDecrement();
                }}
                className={cn(stepBtnClass, 'mt-2 sm:mt-3')}
            >
                <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
        </div>
    );
}

const get12HourFormat = (hour24: number): number => {
    if (hour24 === 0) return 12;
    if (hour24 > 12) return hour24 - 12;
    return hour24 || 12;
};

const get24HourFormat = (hour12: number, isPM: boolean): number => {
    if (hour12 === 12) {
        return isPM ? 12 : 0;
    }
    return isPM ? hour12 + 12 : hour12;
};

export default function ModernTimePicker({
    value = '',
    onChange,
    placeholder = 'اختر الوقت',
    className = '',
    disabled = false,
    portalContainer: portalContainerProp,
}: ModernTimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [period, setPeriod] = useState<'AM' | 'PM'>('PM');
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [dropdownWidth, setDropdownWidth] = useState(DROPDOWN_WIDTH_LG);
    const [positionMode, setPositionMode] = useState<'fixed' | 'absolute'>('fixed');
    const [portalContainer, setPortalContainer] = useState<HTMLElement | DocumentFragment | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const dropdownId = useId();

    const parseTime = useCallback((timeStr: string) => {
        if (!timeStr) return { hour24: 12, minute: 0 };
        const [hourStr, minuteStr] = timeStr.split(':');
        return {
            hour24: parseInt(hourStr) || 0,
            minute: parseInt(minuteStr) || 0,
        };
    }, []);

    useEffect(() => {
        if (value) {
            const { hour24 } = parseTime(value);
            setPeriod(hour24 >= 12 ? 'PM' : 'AM');
        }
    }, [value, parseTime]);

    const updatePosition = useCallback(() => {
        const trigger = triggerRef.current;
        if (!trigger) return;

        const resolved = resolvePortalContainer(trigger, portalContainerProp);
        const width = getDropdownWidth();
        setPortalContainer(resolved.container);
        setPositionMode(resolved.mode);
        setDropdownWidth(width);
        setPosition(computeDropdownPosition(trigger, resolved.mode, resolved.anchor, width));
    }, [portalContainerProp]);

    useLayoutEffect(() => {
        if (!isOpen) return;
        updatePosition();
    }, [isOpen, updatePosition]);

    useEffect(() => {
        if (!isOpen) return;

        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen, updatePosition]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const clickedTrigger = triggerRef.current?.contains(target);
            const clickedDropdown = dropdownRef.current?.contains(target);

            if (!clickedTrigger && !clickedDropdown) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const { hour24, minute: currentMinute } = parseTime(value || '12:00');
    const currentHour12 = get12HourFormat(hour24);

    const handleTimeChange = useCallback((type: 'hour' | 'minute', newValue: number) => {
        const { hour24: curHour24, minute: curMinute } = parseTime(value || '12:00');

        let newHour24 = curHour24;
        let newMinute = curMinute;

        if (type === 'hour') {
            newHour24 = get24HourFormat(newValue, period === 'PM');
        } else {
            newMinute = newValue;
        }

        const newTime = `${String(newHour24).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;
        onChange(newTime);
    }, [value, period, onChange, parseTime]);

    const handlePeriodChange = useCallback((newPeriod: 'AM' | 'PM') => {
        setPeriod(newPeriod);

        const { hour24: curHour24, minute: curMinute } = parseTime(value || '12:00');
        const hour12 = get12HourFormat(curHour24);
        const newHour24 = get24HourFormat(hour12, newPeriod === 'PM');

        const newTime = `${String(newHour24).padStart(2, '0')}:${String(curMinute).padStart(2, '0')}`;
        onChange(newTime);
    }, [value, onChange, parseTime]);

    const incrementHour = useCallback(() => {
        const hour12 = get12HourFormat(hour24);
        const newHour12 = hour12 === 12 ? 1 : hour12 + 1;
        handleTimeChange('hour', newHour12);
    }, [hour24, handleTimeChange]);

    const decrementHour = useCallback(() => {
        const hour12 = get12HourFormat(hour24);
        const newHour12 = hour12 === 1 ? 12 : hour12 - 1;
        handleTimeChange('hour', newHour12);
    }, [hour24, handleTimeChange]);

    const incrementMinute = useCallback(() => {
        handleTimeChange('minute', currentMinute === 59 ? 0 : currentMinute + 1);
    }, [currentMinute, handleTimeChange]);

    const decrementMinute = useCallback(() => {
        handleTimeChange('minute', currentMinute === 0 ? 59 : currentMinute - 1);
    }, [currentMinute, handleTimeChange]);

    const formatDisplayTime = useCallback(() => {
        if (!value) return '';
        const { hour24: h24, minute: m } = parseTime(value);
        const hour12 = get12HourFormat(h24);
        const periodText = h24 >= 12 ? 'م' : 'ص';
        return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${periodText}`;
    }, [value, parseTime]);

    const clearTime = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setIsOpen(false);
    };

    const toggleOpen = () => {
        if (disabled) return;
        if (!isOpen) {
            updatePosition();
            setIsOpen(true);
            return;
        }
        setIsOpen(false);
    };

    const dropdown = (
        <AnimatePresence>
            {isOpen && !disabled && (
                <motion.div
                    ref={dropdownRef}
                    id={dropdownId}
                    role="listbox"
                    aria-label={placeholder}
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    onMouseDown={stopPickerEvent}
                    onPointerDown={stopPickerEvent}
                    className="pointer-events-auto z-[200] rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-elevated sm:p-4"
                    style={{
                        position: positionMode,
                        top: position.top,
                        left: position.left,
                        width: dropdownWidth,
                        transformOrigin: 'top center',
                    }}
                >
                    <div className="flex items-center justify-center gap-0.5 sm:gap-1 md:gap-1.5" dir="ltr">
                        <div className="flex flex-col items-center">
                            <button
                                type="button"
                                onPointerDown={stopPickerEvent}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePeriodChange(period === 'AM' ? 'PM' : 'AM');
                                }}
                                className={cn(stepBtnClass, 'mb-0.5 sm:mb-1')}
                            >
                                <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>

                            <div className="flex h-10 w-9 items-center justify-center rounded-lg border-2 border-border bg-card shadow-sm sm:h-12 sm:w-10 sm:rounded-xl md:h-14 md:w-12">
                                <span className="select-none text-sm font-bold text-foreground sm:text-base md:text-lg">
                                    {period === 'AM' ? 'ص' : 'م'}
                                </span>
                            </div>

                            <button
                                type="button"
                                onPointerDown={stopPickerEvent}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePeriodChange(period === 'AM' ? 'PM' : 'AM');
                                }}
                                className={cn(stepBtnClass, 'mt-0.5 sm:mt-1')}
                            >
                                <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                        </div>

                        <div className="mb-3 text-lg font-bold text-primary sm:mb-4 sm:text-xl md:text-2xl">:</div>

                        <TimeDigitPicker
                            value={currentMinute}
                            max={59}
                            label="دقيقة"
                            onIncrement={incrementMinute}
                            onDecrement={decrementMinute}
                            onChange={(val) => handleTimeChange('minute', val)}
                        />

                        <div className="mb-3 text-lg font-bold text-primary sm:mb-4 sm:text-xl md:text-2xl">:</div>

                        <TimeDigitPicker
                            value={currentHour12}
                            max={12}
                            label="ساعة"
                            onIncrement={incrementHour}
                            onDecrement={decrementHour}
                            onChange={(val) => {
                                const validVal = val === 0 ? 12 : val > 12 ? val % 12 : val;
                                handleTimeChange('hour', validVal);
                            }}
                        />
                    </div>

                    <button
                        type="button"
                        onPointerDown={stopPickerEvent}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                        }}
                        className="mt-2.5 w-full rounded-md bg-primary py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:mt-3 sm:py-2"
                    >
                        تم
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className={cn('relative', className)} ref={triggerRef}>
            <div className="relative">
                <input
                    type="text"
                    placeholder={placeholder}
                    className={cn(
                        'flex h-10 w-full cursor-pointer rounded-md border border-input bg-background py-2 pl-8 pr-10 text-sm text-foreground ring-offset-background transition-colors',
                        'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                        disabled && 'cursor-not-allowed opacity-50',
                    )}
                    value={formatDisplayTime()}
                    onClick={toggleOpen}
                    readOnly
                    disabled={disabled}
                    role="combobox"
                    aria-haspopup="dialog"
                    aria-controls={dropdownId}
                    aria-expanded={isOpen}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                </span>
                {value && !disabled && (
                    <button
                        type="button"
                        onClick={clearTime}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-destructive"
                        title="مسح"
                        aria-label="Clear time"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {typeof document !== 'undefined' && portalContainer && createPortal(dropdown, portalContainer)}
        </div>
    );
}
