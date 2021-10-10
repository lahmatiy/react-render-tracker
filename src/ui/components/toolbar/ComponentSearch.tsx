import * as React from "react";
import { useFindMatchContext } from "../../utils/find-match";
import { Cancel, Search } from "../common/icons";
import SearchMatchesNav from "./SearchMatchesNav";

interface ComponentSearchProps {
  groupByParent: boolean;
  showUnmounted: boolean;
}

const ComponentSearch = ({
  groupByParent,
  showUnmounted,
}: ComponentSearchProps) => {
  const autoselectRef = React.useRef(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const { setPattern: setContextPattern } = useFindMatchContext();
  const [pattern, setPattern] = React.useState("");
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    autoselectRef.current = true;
    setContextPattern(e.target.value);
    setPattern(e.target.value);
  };

  return (
    <div className="component-search">
      {Search}
      <input
        ref={inputRef}
        placeholder="Find by display name"
        onInput={handleInput}
        value={pattern}
      />
      {pattern && (
        <>
          <SearchMatchesNav
            groupByParent={groupByParent}
            showUnmounted={showUnmounted}
            autoselect={autoselectRef}
            pattern={pattern}
          />
          <span className="component-search__buttons">
            <button
              className="component-search__button"
              onClick={() => {
                setContextPattern("");
                setPattern("");
                inputRef.current?.focus();
              }}
            >
              {Cancel}
            </button>
          </span>
        </>
      )}
    </div>
  );
};

export default ComponentSearch;
