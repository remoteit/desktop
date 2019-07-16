import React from "react";
import { storiesOf } from "@storybook/react";
import { withKnobs } from "@storybook/addon-knobs";
import { SettingsPage } from "./SettingsPage";

storiesOf("components", module)
  .addDecorator(withKnobs)
  .add("SettingsPage", () => <SettingsPage />);
