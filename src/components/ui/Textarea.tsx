import type {
  ChangeEventHandler,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { FieldErrorMessage } from "./FieldErrorMessage";
import {
  cn,
  fieldControlClassName,
  fieldHelperClassName,
  fieldLabelClassName,
} from "./styles";

type TextareaProps = {
  error?: string;
  helperText?: string;
  label: string;
  leadingIcon?: ReactNode;
  name: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  placeholder?: string;
  required?: boolean;
  value: string;
} & Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  | "aria-invalid"
  | "children"
  | "name"
  | "onChange"
  | "placeholder"
  | "required"
  | "value"
>;

export function Textarea({
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
  rows = 5,
  value,
  ...props
}: TextareaProps) {
  const textareaId = id ?? name;
  const errorId = `${textareaId}-error`;
  const helperId = `${textareaId}-helper`;
  const hasError = Boolean(error);
  const describedBy = hasError ? errorId : helperText ? helperId : undefined;

  return (
    <div className={className}>
      <label className={fieldLabelClassName} htmlFor={textareaId}>
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </label>
      <div className="relative mt-2">
        {leadingIcon ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-slate-400"
          >
            {leadingIcon}
          </span>
        ) : null}
        <textarea
          aria-describedby={describedBy}
          aria-invalid={hasError}
          className={cn(
            fieldControlClassName,
            "min-h-36 resize-y leading-6",
            leadingIcon ? "pl-11" : undefined,
            hasError &&
              "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10",
          )}
          disabled={disabled}
          id={textareaId}
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          rows={rows}
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
