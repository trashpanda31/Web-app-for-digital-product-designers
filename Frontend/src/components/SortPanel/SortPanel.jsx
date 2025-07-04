import React, { useState, useEffect } from 'react';

const SORT_OPTIONS = {
  sort: {
    label: 'Recent',
    options: ['Recent', 'Relevant', 'Popular']
  }
};

export const SortPanel = ({ containerClassName = '', buttonClassName = '', textClassName = '', onSortChange }) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedSort, setSelectedSort] = useState(() => {
    const savedSort = localStorage.getItem('sortPanelSort');
    return savedSort || 'Recent';
  });

  useEffect(() => {
    localStorage.setItem('sortPanelSort', selectedSort);
    if (onSortChange) {
      onSortChange(selectedSort.toLowerCase());
    }
  }, [selectedSort, onSortChange]);

  const handleSortClick = (sortKey) => {
    setActiveDropdown(activeDropdown === sortKey ? null : sortKey);
  };

  const handleOptionSelect = (sortKey, option) => {
    setSelectedSort(option);
    setActiveDropdown(null);
  };

  return (
    <div className={containerClassName}>
      {Object.entries(SORT_OPTIONS).map(([key, { label, options }]) => (
        <div key={key} className="relative">
          <button
            onClick={() => handleSortClick(key)}
            className={`bg-[#D9D9D9] rounded-[14px] border-none outline-none focus:outline-none ${buttonClassName}`}
          >
            <span className={textClassName}>
              {selectedSort || label}
            </span>
          </button>

          {activeDropdown === key && (
            <div className="absolute z-50 mt-2 animate-slideDown origin-top">
              <div className="w-[109px] bg-[#D9D9D9] rounded-[14px] border-[0.5px] border-solid border-black shadow-none overflow-hidden">
                <div className="flex flex-col w-full">
                  {options.map((option, index) => (
                    <div key={option}
                      className="relative w-full">

                      <button onClick={() => handleOptionSelect(key, option)}
                        className={`w-full h-11 flex items-center justify-center bg-[#D9D9D9] hover:bg-[#E8E8E8] transition-colors outline-none border-none focus:outline-none ${selectedSort === option ? 'bg-[#C0C0C0]' : ''}`}>
                        <span className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-sm tracking-[0] leading-[normal]">
                          {option}
                        </span>
                      </button>

                      {index < options.length - 1 && (
                        <div className="absolute bottom-0 left-0 w-full flex justify-center pointer-events-none px-2">
                          <div className="w-[85%] h-[1px] bg-[#666666] opacity-50 rounded-[4px]" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}; 