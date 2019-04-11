import React from "react";
import { storiesOf } from "@storybook/react";
import { withKnobs } from "@storybook/addon-knobs";
import { DeviceListPage } from "./DeviceListPage";

storiesOf("components", module)
  .addDecorator(withKnobs)
  .add("DeviceListPage", () => <DeviceListPage />);
