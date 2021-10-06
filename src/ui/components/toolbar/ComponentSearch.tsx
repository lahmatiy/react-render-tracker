import * as React from "react";
import debounce from "lodash.debounce";
import { useFiberMaps } from "../../utils/fiber-maps";
import { useFindMatchContext } from "../../utils/find-match";
import { useSelectedId } from "../../utils/selection";
import { ChevronUp, ChevronDown, Search } from "../common/icons";

interface ComponentSearchProps {
  groupByParent: boolean;
  showUnmounted: boolean;
  onChange: (pattern: string) => void;
  value: string;
}

const MatchesNavigation = ({
  groupByParent,
  showUnmounted,
  autoselect,
  pattern,
}: {
  groupByParent: boolean;
  showUnmounted: boolean;
  autoselect: React.MutableRefObject<boolean>;
  pattern: string;
}) => {
  const { selectedId, select } = useSelectedId();
  const { match, setPattern } = useFindMatchContext();
  const { selectTree, fiberById } = useFiberMaps();
  const tree = selectTree(groupByParent, showUnmounted);
  const [treeUpdate, setTreeUpdate] = React.useState(0);
  const [matches, setMatches] = React.useState<{
    index: number;
    total: number;
  } | null>(null);

  React.useEffect(() => {
    let firstMatchId: number | null = null;
    let index = 0;
    let total = 0;

    setPattern(pattern);
    tree.walk(node => {
      const fiber = fiberById.get(node.id);

      if (fiber !== undefined && match(fiber.displayName)) {
        total++;

        if (node.id === selectedId) {
          index = total;
        }

        if (firstMatchId === null) {
          firstMatchId = node.id;
        }
      }
    });

    if (autoselect.current && total > 0 && index === 0) {
      select(firstMatchId, false);
      index = 1;
    }

    autoselect.current = false;
    setMatches({ index, total });

    return tree.subscribe(() => setTreeUpdate(state => state + 1));
  }, [selectedId, match, tree, treeUpdate, pattern]);

  if (matches === null) {
    return null;
  }

  const disableButtons = matches.index > 0 && matches.total < 2;

  return (
    <div className="component-search-matches-iterator">
      <span className="component-search-matches-iterator__label">
        {matches.total
          ? `${matches.index || "–"} / ${matches.total}`
          : "No matches"}
      </span>
      <span className="component-search-matches-iterator__buttons">
        <button
          className="component-search-matches-iterator__button"
          disabled={disableButtons}
          onClick={
            disableButtons
              ? undefined
              : () => {
                  const node = tree.findBack(node => {
                    const fiber = fiberById.get(node.id);

                    return (
                      fiber !== undefined && match(fiber.displayName) !== null
                    );
                  }, selectedId);

                  if (node) {
                    select(node.id, false);
                  }
                }
          }
        >
          {ChevronUp}
        </button>
        <button
          className="component-search-matches-iterator__button"
          disabled={disableButtons}
          onClick={
            disableButtons
              ? undefined
              : () => {
                  const node = tree.find(node => {
                    const fiber = fiberById.get(node.id);

                    return (
                      fiber !== undefined && match(fiber.displayName) !== null
                    );
                  }, selectedId);

                  console.log(node);

                  if (node) {
                    select(node.id, false);
                  }
                }
          }
        >
          {ChevronDown}
        </button>
      </span>
    </div>
  );
};

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
        <MatchesNavigation
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
