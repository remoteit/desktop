import React from "react";
import { storiesOf } from "@storybook/react";
import { withKnobs } from "@storybook/addon-knobs";
import { SearchOnlyToggle } from "./SearchOnlyToggle";

storiesOf("components", module)
  .addDecorator(withKnobs)
  .add("SearchOnlyToggle", () => <SearchOnlyToggle />);
