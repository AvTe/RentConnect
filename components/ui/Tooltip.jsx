import React, { useState } from 'react';

export const Tooltip = ({ children, content, position = 'top' }) => {
    const [show, setShow] = useState(false);

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    const arrowClasses = {
        top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900',
        left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900',
        right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900'
    };

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            {children}
            {show && content && (
                <div className={`absolute z-[100] ${positionClasses[position]} pointer-events-none`}>
                    <div className="bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
                        {content}
                        <div className={`absolute border-4 border-transparent ${arrowClasses[position]}`} />
                    </div>
                </div>
            )}
        </div>
    );
};
