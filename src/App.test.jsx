
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

test("renders todos", async () => {
  render(<App />);

  const listitems = await screen.findByRole("listitem");
  expect(listitems).toHaveLength(3);

  userEvent.type(screen.getByRole("textbox"), "공부하기");
  userEvent.click(screen.getByRole("button"));

  expect(await screen.findByText("공부하기")).toBeInTheDocument();
});