import { InputField, type InputFieldProps } from "./InputField";

type NumberInputProps = Omit<InputFieldProps, "type">;

export function NumberInput(props: NumberInputProps) {
  return <InputField {...props} type="number" />;
}
