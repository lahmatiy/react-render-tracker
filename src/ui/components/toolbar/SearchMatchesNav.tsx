import * as React from "react";
import debounce from "lodash.debounce";
import { useFiberMaps } from "../../utils/fiber-maps";
import { useFindMatchContext } from "../../utils/find-match";
import { useSelectedId } from "../../utils/selection";
import { ChevronUp, ChevronDown } from "../common/icons";
import { useTreeUpdateSubscription } from "../../utils/tree";
import { usePinnedId } from "../../utils/pinned";

const SearchMatchesNav = ({
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
  const { pinnedId } = usePinnedId();
  const { match } = useFindMatchContext();
  const { selectTree } = useFiberMaps();
  const tree = selectTree(groupByParent, showUnmounted);
  const treeRoot = tree.getOrCreate(pinnedId);
  const selectedNode =
    selectedId !== null ? tree.get(selectedId) || null : null;
  const treeUpdate = useTreeUpdateSubscription(tree);
  const [matches, setMatches] = React.useState<{
    index: number;
    total: number;
  } | null>(null);
  const selectDebounced = React.useMemo(
    () =>
      debounce(id => select(id, false), 100, {
        maxWait: 200,
      }),
    []
  );

  React.useEffect(() => {
    let firstMatchId: number | null = null;
    let index = 0;
    let total = 0;

    treeRoot.walk(node => {
      if (match(node.fiber?.displayName || null) !== null) {
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
      selectDebounced(firstMatchId);
      index = 1;
    }

    autoselect.current = false;
    setMatches({ index, total });
  }, [selectedId, match, tree, treeRoot, treeUpdate, pattern]);

  if (matches === null) {
    return null;
  }

  const disableButtons =
    matches.total === 0 || (matches.total === 1 && matches.index === 1);

  return (
    <div className="component-search-matches-nav">
      <span className="component-search-matches-nav__label">
        {matches.total
          ? `${matches.index || "–"} / ${matches.total}`
          : "No matches"}
      </span>
      <span className="component-search-matches-nav__buttons">
        <button
          className="component-search-matches-nav__button"
          disabled={disableButtons}
          onClick={() => {
            const startNode =
              treeRoot === tree.root
                ? selectedNode
                : selectedNode !== null && treeRoot.contains(selectedNode)
                ? selectedNode
                : null;
            const node = treeRoot.findBack(
              node =>
                node.id !== selectedId &&
                match(node.fiber?.displayName || null) !== null,
              startNode
            );

            if (node) {
              select(node.id, false);
            }
          }}
        >
          {ChevronUp}
        </button>
        <button
          className="component-search-matches-nav__button"
          disabled={disableButtons}
          onClick={() => {
            const startNode =
              treeRoot === tree.root
                ? selectedNode
                : selectedNode !== null && treeRoot.contains(selectedNode)
                ? selectedNode
                : null;
            const node = treeRoot.find(
              node =>
                node.id !== selectedId &&
                match(node.fiber?.displayName || null) !== null,
              startNode
            );

            if (node) {
              select(node.id, false);
            }
          }}
        >
          {ChevronDown}
        </button>
      </span>
    </div>
  );
};

export default SearchMatchesNav;
