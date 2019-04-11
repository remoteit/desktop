import React from "react";
import { storiesOf } from "@storybook/react";
import { withKnobs } from "@storybook/addon-knobs";
import { SignIn } from "./SignIn";

storiesOf("components", module)
  .addDecorator(withKnobs)
  .add("SignIn", () => <SignIn />);
