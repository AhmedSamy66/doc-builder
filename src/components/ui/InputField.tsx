import type {
  ChangeEventHandler,
  HTMLInputTypeAttribute,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import { FieldErrorMessage } from "./FieldErrorMessage";
import {
  cn,
  fieldControlClassName,
  fieldHelperClassName,
  fieldIconClassName,
  fieldLabelClassName,
} from "./styles";

export type InputFieldProps = {
  error?: string;
  helperText?: string;
  label: string;
  leadingIcon?: ReactNode;
  name: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  required?: boolean;
  type: HTMLInputTypeAttribute;
  value: string;
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | "aria-invalid"
  | "children"
  | "name"
  | "onChange"
  | "placeholder"
  | "required"
  | "type"
  | "value"
>;

export function InputField({
  className,
  disabled,
  error,
  helperText,
  id,
  label,
  leadingIcon,
  name,
  onChange,
  placeholder,
  required = false,
  type,
  value,
  ...props
}: InputFieldProps) {
  const inputId = id ?? name;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const hasError = Boolean(error);
  const describedBy = hasError ? errorId : helperText ? helperId : undefined;

  return (
    <div className={className}>
      <label className={fieldLabelClassName} htmlFor={inputId}>
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </label>
      <div className="relative mt-2">
        {leadingIcon ? (
          <span aria-hidden="true" className={fieldIconClassName}>
            {leadingIcon}
          </span>
        ) : null}
        <input
          aria-describedby={describedBy}
          aria-invalid={hasError}
          className={cn(
            fieldControlClassName,
            "h-12",
            leadingIcon ? "pl-11" : undefined,
            hasError &&
              "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10",
          )}
          disabled={disabled}
          id={inputId}
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          type={type}
          value={value}
          {...props}
        />
      </div>
      {helperText && !hasError ? (
        <p className={fieldHelperClassName} id={helperId}>
          {helperText}
        </p>
      ) : null}
      {error ? (
        <FieldErrorMessage id={errorId}>{error}</FieldErrorMessage>
      ) : null}
    </div>
  );
}
