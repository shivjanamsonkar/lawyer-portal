import { fireEvent, render, screen } from "@testing-library/react";
import { AlarmTestModal } from "@/components/AlarmTestModal";

jest.mock("lucide-react", () => new Proxy({}, { get: () => () => null }));

test("plays a three-tone alarm preview and reports success", async () => {
  const oscillator = { type: "sine", frequency: { value: 0 }, connect: jest.fn(), start: jest.fn(), stop: jest.fn() };
  const gain = { gain: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() }, connect: jest.fn() };
  const audioContext = {
    currentTime: 0,
    destination: {},
    createOscillator: jest.fn(() => oscillator),
    createGain: jest.fn(() => gain),
    close: jest.fn().mockResolvedValue(undefined),
  };
  const constructor = jest.fn(() => audioContext);
  Object.defineProperty(window, "AudioContext", { configurable: true, value: constructor });
  jest.useFakeTimers();
  render(<AlarmTestModal />);
  fireEvent.click(screen.getByRole("button", { name: /test chamber alarm/i }));
  fireEvent.click(screen.getByRole("button", { name: /play sound/i }));
  expect(constructor).toHaveBeenCalledTimes(1);
  expect(audioContext.createOscillator).toHaveBeenCalledTimes(3);
  expect(screen.getByText("Alarm preview played")).toBeInTheDocument();
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});
