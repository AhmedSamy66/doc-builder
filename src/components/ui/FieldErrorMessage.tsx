import { AlertCircle } from "lucide-react";
import { fieldErrorClassName } from "./styles";

type FieldErrorMessageProps = {
  children: string;
  id: string;
};

export function FieldErrorMessage({ children, id }: FieldErrorMessageProps) {
  return (
    <p className={fieldErrorClassName} id={id}>
      <AlertCircle
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0"
        strokeWidth={2.25}
      />
      <span>{children}</span>
    </p>
  );
}
