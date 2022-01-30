import React from "../react";
import { TestCase } from "../types";

export default {
  title: "RRT readme demo screenshot",
  Root: App,
} as TestCase;

type Model = { id: number; caption: string; checked: boolean };
type User = { id: number; name: string; avatar: string };

type Settings = {
  darkmode: boolean;
};
const Settings = React.createContext<Settings>({ darkmode: false });
Settings.displayName = "Settings";

function App() {
  const [user, setUser] = React.useState<User | null>(null);
  const [items, setItems] = React.useState<Model[] | null>(null);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);

  React.useEffect(() => {
    // emulate data fetch
    setSelectedId(23.01);
    setItems([]);

    Promise.resolve([
      { id: 1, caption: "Foo", checked: false },
      { id: 23, caption: "Bar", checked: true },
      { id: 566, caption: "Baz", checked: false },
    ]).then(items => {
      setSelectedId(23);
      setItems(items);
    });

    Promise.resolve({ id: 123, name: "User", avatar: "url to image" }).then(
      setUser
    );
  }, []);

  return (
    <Settings.Provider value={{ darkmode: false }}>
      <Header
        title="Demo app for a screenshot"
        datetime={new Date()}
        user={user}
      />
      <List
        items={items || []}
        limit={10}
        selectedId={Math.round(selectedId || 1)}
      />
      <Overlay />
    </Settings.Provider>
  );
}

const Header = React.memo(function ({
  title,
  datetime,
  user,
}: {
  title: string;
  datetime: Date;
  user: User | null;
}) {
  const formattedDate = useFormattedDate(datetime);
  const avatar = React.useMemo(
    () =>
      user ? (
        <Avatar name={user.name} image={user.avatar} />
      ) : (
        <Loader>
          <AvatarPlaceholder />
        </Loader>
      ),
    [user?.name, user?.avatar]
  );

  return (
    <h1>
      {avatar}
      {title} ({formattedDate})
    </h1>
  );
});

Header.displayName = "Header";

function Avatar({ name, image }: { name: string; image: string }) {
  return (
    <>
      <img src={image} /> {name}
    </>
  );
}

const List = React.memo(function ({
  items,
  limit,
  selectedId,
}: {
  items: Model[];
  limit: number;
  selectedId: number | null;
}) {
  const [, setConfig] = React.useState<{
    initial?: boolean;
    dataset: string;
    rest?: number;
    rest2?: number;
  }>({ initial: true, dataset: "none", rest: 123, rest2: 123 });

  React.useEffect(() => {
    setConfig({ dataset: "default", rest: 123, rest2: 123 });
  }, []);

  if (!items || !items.length) {
    return <Loader>loading...</Loader>;
  }

  return (
    <ul>
      {items.slice(0, limit).map(item => (
        <ListItem
          key={item.id}
          selected={item.id === selectedId}
          caption={item.caption}
          checked={item.checked}
        />
      ))}
    </ul>
  );
});

List.displayName = "List";

function ListItem({
  caption,
  checked,
  selected,
}: {
  caption: string;
  checked: boolean;
  selected: boolean;
}) {
  const [localChecked, setChecked] = React.useState(checked);

  return (
    <li
      className={[
        localChecked ? "done" : "incomplete",
        selected ? "selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Checkbox checked={localChecked} onChange={setChecked} />
      {caption}
    </li>
  );
}

function Checkbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (state: boolean) => void;
}) {
  const darkmode = useDarkmode();

  React.useEffect(() => {
    if (checked) {
      setTimeout(() => onChange(false));
    }
  }, [checked]);

  return (
    <input
      className={darkmode ? "darkmode" : "lightmode"}
      type="checkbox"
      checked={checked}
      onChange={(e: React.ChangeEvent) =>
        onChange((e.target as HTMLInputElement).checked)
      }
    />
  );
}

function Overlay() {
  const [visible, setVisible] = React.useState(true);

  if (!visible) {
    return null;
  }

  return (
    <div className="react-overlay">
      <button
        style={{ position: "absolute", bottom: 0 }}
        onClick={() => setVisible(false)}
      >
        x
      </button>
    </div>
  );
}

function Loader({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function AvatarPlaceholder() {
  return <>placeholder</>;
}

function useFormattedDate(datetime: Date) {
  const formattedDate = React.useMemo(() => datetime.toISOString(), [datetime]);

  return formattedDate;
}

function useDarkmode() {
  const { darkmode } = React.useContext(Settings);

  return darkmode;
}
