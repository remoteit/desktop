import React from "react";
import { storiesOf } from "@storybook/react";
import { withKnobs } from "@storybook/addon-knobs";
import { InstallationNotice } from "./InstallationNotice";

storiesOf("components", module)
  .addDecorator(withKnobs)
  .add("InstallationNotice", () => <InstallationNotice />);
