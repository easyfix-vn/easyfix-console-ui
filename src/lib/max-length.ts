export type MaxLengthElement = HTMLInputElement | HTMLTextAreaElement;

export function isOverMaxLength(value: string, maxLength?: number): boolean {
  return maxLength != null && value.length > maxLength;
}

export function syncMaxLengthValidity(
  element: MaxLengthElement,
  value: string,
  maxLength?: number,
): boolean {
  const overLimit = isOverMaxLength(value, maxLength);
  element.setCustomValidity(
    overLimit
      ? `Please enter no more than ${maxLength} characters.`
      : "",
  );
  return overLimit;
}
