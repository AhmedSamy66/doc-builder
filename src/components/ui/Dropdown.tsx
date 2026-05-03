import type {
  ChangeEventHandler,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { FieldErrorMessage } from "./FieldErrorMessage";
import {
  cn,
  fieldControlClassName,
  fieldHelperClassName,
  fieldIconClassName,
  fieldLabelClassName,
} from "./styles";

export type DropdownOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

type DropdownProps = {
  error?: string;
  helperText?: string;
  label: string;
  leadingIcon?: ReactNode;
  onChange: ChangeEventHandler<HTMLSelectElement>;
  options: readonly DropdownOption[];
  placeholder?: string;
  required?: boolean;
  value: string;
} & Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  | "aria-invalid"
  | "children"
  | "onChange"
  | "placeholder"
  | "required"
  | "value"
>;

export function Dropdown({
  className,
  disabled,
  error,
  helperText,
  id,
  label,
  leadingIcon,
  name,
  onChange,
  options,
  placeholder = "Select an option",
  required = false,
  value,
  ...props
}: DropdownProps) {
  const selectId = id ?? name ?? label.toLowerCase().replace(/\s+/g, "-");
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;
  const hasError = Boolean(error);
  const describedBy = hasError ? errorId : helperText ? helperId : undefined;

  return (
    <div className={className}>
      <label className={fieldLabelClassName} htmlFor={selectId}>
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </label>
      <div className="relative mt-2">
        {leadingIcon ? (
          <span aria-hidden="true" className={fieldIconClassName}>
            {leadingIcon}
          </span>
        ) : null}
        <select
          aria-describedby={describedBy}
          aria-invalid={hasError}
          className={cn(
            fieldControlClassName,
            "h-12 appearance-none bg-[linear-gradient(45deg,transparent_50%,#475569_50%),linear-gradient(135deg,#475569_50%,transparent_50%)] bg-size-[5px_5px,5px_5px] bg-position-[calc(100%-18px)_50%,calc(100%-13px)_50%] bg-no-repeat pr-10",
            leadingIcon ? "pl-11" : undefined,
            hasError &&
              "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10",
          )}
          disabled={disabled}
          id={selectId}
          name={name}
          onChange={onChange}
          required={required}
          value={value}
          {...props}
        >
          <option disabled={required} value="">
            {placeholder}
          </option>
          {options.map((option) => (
            <option
              disabled={option.disabled}
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {helperText && !hasError ? (
        <p className={fieldHelperClassName} id={helperId}>
          {helperText}
        </p>
      ) : null}
      {error ? <FieldErrorMessage id={errorId}>{error}</FieldErrorMessage> : null}
    </div>
  );
}
