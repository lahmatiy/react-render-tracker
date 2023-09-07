import * as React from "react";
import {
  Cancel as CancelIcon,
  Search as SearchIcon,
} from "../../components/common/icons";

interface ComponentSearchProps {
  value: string | null;
  setValue(pattern: string): void;
}

interface SearchInputProps {
  value: string;
  setValue(pattern: string): void;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, setValue }: SearchInputProps, inputRef) => {
    const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value);
    };
    const handleKeyDown = (event: React.KeyboardEvent) => {
      switch (event.code) {
        case "Escape":
          setValue("");
          break;
      }
    };

    return (
      <input
        ref={inputRef}
        placeholder="Filter by display name"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        value={value}
      />
    );
  }
);
SearchInput.displayName = "SearchInput";

const ComponentSearch = ({ value, setValue }: ComponentSearchProps) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <div className="component-search">
      {SearchIcon}
      <SearchInput ref={inputRef} value={value || ""} setValue={setValue} />
      {value && (
        <>
          <span className="component-search__buttons">
            <button
              className="component-search__button"
              onClick={() => {
                setValue("");
                inputRef.current?.focus();
              }}
            >
              {CancelIcon}
            </button>
          </span>
        </>
      )}
    </div>
  );
};

export default ComponentSearch;
