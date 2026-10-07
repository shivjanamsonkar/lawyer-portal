import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { http, HttpResponse } from "msw";
import { LoginForm } from "@/components/LoginForm";
import { server } from "../test/server";

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));

test("signs in an approved account", async () => {
  const user = userEvent.setup();
  const push = jest.fn();
  (useRouter as jest.Mock).mockReturnValue({ push, refresh: jest.fn() });
  server.use(http.post("http://localhost/api/auth/login", () => HttpResponse.json({ user: { role: "ADVOCATE" }, must_change_password: false })));
  render(<LoginForm />);
  fireEvent.change(screen.getByLabelText("Mobile number"), { target: { value: "+919876543210" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "SecurePass123!" } });
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  expect(push).toHaveBeenCalledWith("/");
});

test.each(["PENDING_APPROVAL", "DISABLED"])("shows approval error for a %s account", async (accountStatus) => {
  const user = userEvent.setup();
  server.use(http.post("http://localhost/api/auth/login", () => HttpResponse.json({ detail: "Aapka mobile number abhi admin dwara approve nahi hua hai. Kripya admin se sampark karein." }, { status: 403 })));
  render(<LoginForm />);
  fireEvent.change(screen.getByLabelText("Mobile number"), { target: { value: "+919876543210" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "SecurePass123!" } });
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("approve nahi hua");
});
