/**
 * Local declarations for `react-native-insta-pagination-dots`.
 *
 * The package ships TypeScript source at `src/index.tsx` and compiled
 * JavaScript at `lib/commonjs/`, but its `package.json` points `types` at
 * `lib/typescript/src/index.d.ts`, which it does not include. The props below
 * are copied from the package's own `IDotContainerProps`, so this declares the
 * real API rather than widening it to `any`.
 */
declare module "react-native-insta-pagination-dots" {
  import type { FC } from "react";

  export interface IDotContainerProps {
    curPage: number;
    maxPage: number;
    sizeRatio?: number;
    activeDotColor: string;
    inactiveDotColor?: string;
    vertical?: boolean;
  }

  const DotContainer: FC<IDotContainerProps>;
  export default DotContainer;
}
