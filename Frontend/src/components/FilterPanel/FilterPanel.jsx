import React, { useState, useEffect } from 'react';

const FILTER_OPTIONS = {
  assetType: {
    label: 'Asset type',
    options: ['Photo', 'Illustration', 'Vector', '3D']
  },
  aiGenerated: {
    label: 'AI-generated',
    options: ['Yes', 'No']
  },
  color: {
    label: 'Color',
    options: ['Red', 'Blue', 'Black', 'White', 'Green', 'Other']
  },
  people: {
    label: 'People',
    options: ['None', 'One', 'Multiple', 'Group']
  },
  fileType: {
    label: 'File type',
    options: ['Jpeg', 'Png', 'Svg', 'Webp']
  },
  style: {
    label: 'Style',
    options: ['Realistic', 'Flat', '3D', 'Cartoon', 'Abstract', 'Other']
  },
  orientation: {
    label: 'Orientation',
    options: ['Landscape', 'Portrait', 'Square']
  }
};

export const FilterPanel = ({ containerClassName = '', buttonClassName = '', textClassName = '', onFilterChange, initialFilters = {}, shouldPersistFilters = false }) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState(() => {
    if (shouldPersistFilters) {
      const savedFilters = localStorage.getItem('filterPanelFilters');
      return savedFilters ? JSON.parse(savedFilters) : initialFilters;
    }
    return initialFilters;
  });

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(selectedFilters);
    }
    if (shouldPersistFilters) {
      localStorage.setItem('filterPanelFilters', JSON.stringify(selectedFilters));
    }
  }, [selectedFilters, onFilterChange, shouldPersistFilters]);

  useEffect(() => {
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      setSelectedFilters(initialFilters);
      if (onFilterChange) onFilterChange(initialFilters);
    }
  }, [initialFilters]);

  const handleFilterClick = (filterKey) => {
    setActiveDropdown(activeDropdown === filterKey ? null : filterKey);
  };

  const handleOptionSelect = (filterKey, option) => {
    setSelectedFilters(prev => {
      const updated = { ...prev };
      if (option === undefined) {
        delete updated[filterKey];
      } else {
        if (filterKey === 'aiGenerated') {
          if (option === 'Yes') updated[filterKey] = 'Yes';
          else if (option === 'No') updated[filterKey] = 'No';
          else delete updated[filterKey];
        } else {
          updated[filterKey] = option;
        }
      }
      return updated;
    });
    setActiveDropdown(null);
  };

  return (
    <div className={containerClassName}>
      {Object.entries(FILTER_OPTIONS).map(([key, { label, options }]) => (
        <div key={key} className="relative">
          <button
            onClick={() => handleFilterClick(key)}
            className={`bg-[#D9D9D9] rounded-[14px] border-none outline-none ${buttonClassName} ${selectedFilters[key] ? 'bg-[#C0C0C0]' : ''}`}>
            <span className={textClassName}>
              {selectedFilters[key] || label}
            </span>
          </button>

          {activeDropdown === key && (
            <div className="absolute z-50 mt-2 animate-slideDown origin-top">
              <div className="w-[109px] bg-[#D9D9D9] rounded-[14px] border-[0.5px] border-solid border-black shadow-none overflow-hidden">
                <div className="flex flex-col w-full">
                  <div className="relative w-full">
                    <button
                      onClick={() => handleOptionSelect(key, undefined)}
                      className={`w-full h-11 flex items-center justify-center bg-[#D9D9D9] hover:bg-[#E8E8E8] transition-colors outline-none border-none`}>
                      <span className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-sm tracking-[0] leading-[normal]">
                        -
                      </span>
                    </button>
                    <div className="absolute bottom-0 left-0 w-full flex justify-center pointer-events-none px-2">
                      <div className="w-[85%] h-[1px] bg-[#666666] opacity-50 rounded-[4px]" />
                    </div>
                  </div>
                  {options.map((option, index) => (
                    <div key={option}
                      className="relative w-full">
                      <button
                        onClick={() => handleOptionSelect(key, option)}
                        className={`w-full h-11 flex items-center justify-center bg-[#D9D9D9] hover:bg-[#E8E8E8] transition-colors outline-none border-none ${selectedFilters[key] === option ? 'bg-[#C0C0C0]' : ''}`}>
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