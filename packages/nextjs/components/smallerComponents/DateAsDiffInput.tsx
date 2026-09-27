"use client";

import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css'; // Required for base layout
import { daysFromTodayToDate, getTommorow, relativeFromToday } from "~~/utils/formatting";

type Props = {
    disabled: boolean;
    sourceValue: string,
    setSourceValue: (v: string) => void;
}

export const DateAsDiffInput = ({ disabled, sourceValue, setSourceValue }: Props) => {
    const tomorrow = getTommorow();
    let selected = daysFromTodayToDate(Number(sourceValue));

    const handleInputChange = (value: Date) => {
        const daysFromToday = relativeFromToday(value);
        if (daysFromToday <= 0) { return; }
        setSourceValue(`${daysFromToday}`);
        selected = value;
    };

    return (
        <div className="flex items-center gap-4 w-full border-2 p-2 text-sui-input-text font-sans bg-sui-input-background border-sui-input-border">
            <button
                popoverTarget="rdp-popover"
                className="pl-2 text-left w-full font-medium"
                style={{ anchorName: '--rdp' }}
                aria-haspopup="dialog"
            >
                {selected.toLocaleString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' })}
            </button>

            <div
                popover="auto"
                id="rdp-popover"
                className="dropdown bg-base-200 rounded-box shadow-lg border border-base-300 p-4"
                style={{ positionAnchor: '--rdp' }}
            >
                <DayPicker
                    mode="single"
                    required={true}
                    disabled={{before: tomorrow}}
                    selected={selected}
                    onSelect={handleInputChange}
                    startMonth={tomorrow}
                    className="bg-base-100 border border-base-300 shadow-lg rounded-box p-4 text-sui-input-text font-sans font-medium"
                />
            </div>
        </div>
    );    
};
