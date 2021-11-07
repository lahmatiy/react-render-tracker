import * as React from "react";
import { useFiberMaps } from "../../utils/fiber-maps";
import { useFindMatchContext } from "../../utils/find-match";
import { useSelectedId } from "../../utils/selection";
import { Cancel as CancelIcon, Search as SearchIcon } from "../common/icons";
import SearchMatchesNav from "./SearchMatchesNav";

interface ComponentSearchProps {
  groupByParent: boolean;
  showUnmounted: boolean;
}

interface SearchInputProps {
  value: string;
  setValue(pattern: string, autoselect?: boolean): void;
  groupByParent: boolean;
  showUnmounted: boolean;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    { value, setValue, groupByParent, showUnmounted }: SearchInputProps,
    inputRef
  ) => {
    const { selectedId, select } = useSelectedId();
    const { match } = useFindMatchContext();
    const { selectTree } = useFiberMaps();
    const tree = selectTree(groupByParent, showUnmounted);

    const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value, true);
    };
    const handleKeyDown = (event: React.KeyboardEvent) => {
      switch (event.code) {
        case "Enter":
          let node = null;

          if (event.shiftKey) {
            node = tree.findBack(
              node =>
                node.id !== selectedId &&
                match(node.fiber?.displayName || null) !== null,
              selectedId
            );
          } else {
            node = tree.find(
              node =>
                node.id !== selectedId &&
                match(node.fiber?.displayName || null) !== null,
              selectedId
            );
          }

          if (node) {
            select(node.id, false);
          }
          break;

        case "Escape":
          setValue("");
          break;
      }
    };

    return (
      <input
        ref={inputRef}
        placeholder="Find by display name"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        value={value}
      />
    );
  }
);
SearchInput.displayName = "SearchInput";

const ComponentSearch = ({
  groupByParent,
  showUnmounted,
}: ComponentSearchProps) => {
  const autoselectRef = React.useRef(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const { setPattern: setContextPattern } = useFindMatchContext();
  const [pattern, setPattern] = React.useState("");
  const setValue = React.useCallback(
    (pattern: string, autoselect = false) => {
      if (autoselect) {
        autoselectRef.current = true;
      }

      setContextPattern(pattern);
      setPattern(pattern);
    },
    [setContextPattern, setPattern]
  );

  return (
    <div className="component-search">
      {SearchIcon}
      <SearchInput
        ref={inputRef}
        value={pattern}
        setValue={setValue}
        groupByParent={groupByParent}
        showUnmounted={showUnmounted}
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
