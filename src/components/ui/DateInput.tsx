import { InputField, type InputFieldProps } from "./InputField";

type DateInputProps = Omit<InputFieldProps, "type">;

export function DateInput(props: DateInputProps) {
  return <InputField {...props} type="date" />;
}
