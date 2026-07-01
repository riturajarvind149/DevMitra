import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FileUploader from "@/components/FileUploader";

const makeFile = (name: string, size: number, type: string) => {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
};

test("rejects image file larger than 5 MB and shows error", async () => {
  const onChange = jest.fn();
  render(<FileUploader value="" onChange={onChange} accept="image/*" label="Cover" />);

  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const bigImage = makeFile("big.jpg", 6 * 1024 * 1024, "image/jpeg");

  await userEvent.upload(input, bigImage);

  expect(onChange).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toHaveTextContent("5 MB");
});

test("accepts image file within 5 MB limit", async () => {
  const onChange = jest.fn();
  render(<FileUploader value="" onChange={onChange} accept="image/*" label="Cover" />);

  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const smallImage = makeFile("small.jpg", 2 * 1024 * 1024, "image/jpeg");

  await userEvent.upload(input, smallImage);

  expect(screen.queryByRole("alert")).toBeNull();
});
