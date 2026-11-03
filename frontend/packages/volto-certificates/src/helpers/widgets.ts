/**
 * Volto's form widgets, typed for this add-on.
 *
 * The designer's properties panel is built from the same widgets as Volto's
 * own forms and block sidebars, so it looks and behaves like them. Volto
 * writes most of them in JavaScript; these types state the props we use.
 */

import type { ComponentType, ReactNode } from 'react';
import ButtonsWidgetJs from '@plone/volto/components/manage/Widgets/ButtonsWidget';
import CheckboxWidgetJs from '@plone/volto/components/manage/Widgets/CheckboxWidget';
import FormFieldWrapperJs from '@plone/volto/components/manage/Widgets/FormFieldWrapper';
import NumberWidgetJs from '@plone/volto/components/manage/Widgets/NumberWidget';
import SelectWidgetJs from '@plone/volto/components/manage/Widgets/SelectWidget';
import { Option as OptionJs } from '@plone/volto/components/manage/Widgets/SelectStyling';
import TextWidgetJs from '@plone/volto/components/manage/Widgets/TextWidget';
import IconJs from '@plone/volto/components/theme/Icon/Icon';

/** The props every widget takes; `onChange` receives the widget's id. */
export interface WidgetProps<T> {
  id: string;
  title: string;
  description?: string;
  value?: T | null;
  required?: boolean;
  error?: string[];
  isDisabled?: boolean;
  onChange: (id: string, value: T | undefined) => void;
}

export interface SelectWidgetProps extends WidgetProps<string> {
  /** `[value, label]` pairs. */
  choices: [string, string][];
  noValueOption?: boolean;
  isClearable?: boolean;
  placeholder?: string;
  /** Renders an option of the menu, as react-select's `Option` does. */
  customOptionStyling?: ComponentType<SelectOptionProps>;
}

export interface SelectOptionProps {
  data: { value: string; label: string };
  label: string;
  [key: string]: unknown;
}

export interface NumberWidgetProps extends WidgetProps<string | number> {
  minimum?: number;
  maximum?: number;
  step?: number;
}

export interface ButtonsWidgetProps extends WidgetProps<string> {
  actions: string[];
  /** For each action, its icon and its accessible name. */
  actionsInfoMap: Record<string, [unknown, string]>;
}

export interface FormFieldWrapperProps {
  id: string;
  title: string;
  description?: string;
  error?: string[];
  columns?: 1 | 2;
  className?: string;
  /** Leave the label without `for`, when the field is not one input. */
  noForInFieldLabel?: boolean;
  children: ReactNode;
}

export interface IconProps {
  /** An SVG imported from an `icons/` folder. */
  name: unknown;
  size?: string;
  color?: string;
  className?: string;
  title?: string;
  ariaHidden?: boolean;
}

export const ButtonsWidget =
  ButtonsWidgetJs as unknown as ComponentType<ButtonsWidgetProps>;
export const CheckboxWidget = CheckboxWidgetJs as unknown as ComponentType<
  WidgetProps<boolean>
>;
export const FormFieldWrapper =
  FormFieldWrapperJs as unknown as ComponentType<FormFieldWrapperProps>;
export const NumberWidget =
  NumberWidgetJs as unknown as ComponentType<NumberWidgetProps>;
export const SelectWidget =
  SelectWidgetJs as unknown as ComponentType<SelectWidgetProps>;
export const SelectOption =
  OptionJs as unknown as ComponentType<SelectOptionProps>;
export const TextWidget = TextWidgetJs as unknown as ComponentType<
  WidgetProps<string>
>;
export const Icon = IconJs as unknown as ComponentType<IconProps>;
