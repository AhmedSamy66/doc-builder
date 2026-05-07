import { InputField, type InputFieldProps } from "./InputField";

type TextInputProps = Omit<InputFieldProps, "type">;

export function TextInput(props: TextInputProps) {
  return <InputField {...props} type="text" />;
}
