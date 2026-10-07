import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { SignupForm } from "@/components/SignupForm";
import { server } from "../test/server";

const signupResponse = { status: "PENDING_APPROVAL", message: "Aapka account successfully register ho gaya hai. Admin activation ke baad aap login kar payenge." };

function fillSignupForm(): void {
  fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Nisha Kapoor" } });
  fireEvent.change(screen.getByLabelText("Mobile number"), { target: { value: "+919876543210" } });
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "nisha@example.test" } });
  fireEvent.change(screen.getByLabelText("Chamber / office address"), { target: { value: "New Delhi" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "SecurePass123!" } });
}

test("validates mismatched passwords and submits pending registration", async () => {
  const user = userEvent.setup();
  server.use(http.post("http://localhost/api/auth/signup", () => HttpResponse.json(signupResponse, { status: 201 })));
  render(<SignupForm />);
  fillSignupForm();
  fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "OtherPass123!" } });
  await user.click(screen.getByRole("button", { name: "Submit for approval" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Passwords do not match");

  fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "SecurePass123!" } });
  await user.click(screen.getByRole("button", { name: "Submit for approval" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Aapka account successfully register ho gaya hai");
  await waitFor(() => expect(screen.getByLabelText("Full name")).toHaveValue(""));
});
