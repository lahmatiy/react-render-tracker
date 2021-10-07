import * as React from "react";
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
  const { match, setPattern } = useFindMatchContext();
  const { selectTree } = useFiberMaps();
  const tree = selectTree(groupByParent, showUnmounted);
  const treeUpdate = useTreeUpdateSubscription(tree);
  const [matches, setMatches] = React.useState<{
    index: number;
    total: number;
  } | null>(null);

  React.useEffect(() => {
    let firstMatchId: number | null = null;
    let index = 0;
    let total = 0;

    setPattern(pattern);
    tree.get(pinnedId)?.walk(node => {
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
      select(firstMatchId, false);
      index = 1;
    }

    autoselect.current = false;
    setMatches({ index, total });
  }, [selectedId, pinnedId, match, tree, treeUpdate, pattern]);

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
            const node = tree.findBack(
              node =>
                node.id !== selectedId &&
                match(node.fiber?.displayName || null) !== null,
              selectedId
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
            const node = tree.find(
              node =>
                node.id !== selectedId &&
                match(node.fiber?.displayName || null) !== null,
              selectedId
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
