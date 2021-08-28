export type TestCase = {
  title: string;
  Root: React.FunctionComponent<{ title: string }>;
};

declare module "rempl" {
  export function getHost(): {
    activate(): void;
  };
}
