import React from "react";
import { storiesOf } from "@storybook/react";
import { withKnobs } from "@storybook/addon-knobs";
import { ConnectionsPage } from "./ConnectionsPage";

storiesOf("components", module)
  .addDecorator(withKnobs)
  .add("ConnectionsPage", () => <ConnectionsPage />);
