import * as React from "react";
import debounce from "lodash.debounce";
import { useFindMatchContext } from "../../utils/find-match";
import { Search } from "../common/icons";
import SearchMatchesNav from "./SearchMatchesNav";

interface ComponentSearchProps {
  groupByParent: boolean;
  showUnmounted: boolean;
  onChange: (pattern: string) => void;
  value: string;
}

const ComponentSearch = ({
  groupByParent,
  showUnmounted,
  onChange,
}: ComponentSearchProps) => {
  const autoselectRef = React.useRef(false);
  const { setPattern: setContextPattern } = useFindMatchContext();
  const [pattern, setPattern] = React.useState("");
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    autoselectRef.current = true;
    setContextPattern(e.target.value);
    setPattern(e.target.value);
    onChangeDebounced(e.target.value);
  };
  const onChangeDebounced = React.useMemo(
    () =>
      debounce(onChange, 50, {
        maxWait: 75,
      }),
    [onChange]
  );

  return (
    <div className="component-search">
      {Search}
      <input type="text" placeholder="Find component" onChange={handleChange} />
      {pattern && (
        <SearchMatchesNav
          groupByParent={groupByParent}
          showUnmounted={showUnmounted}
          autoselect={autoselectRef}
          pattern={pattern}
        />
      )}
    </div>
  );
};

export default ComponentSearch;
