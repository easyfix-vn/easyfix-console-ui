export interface CountryCodeOption {
  /** 区号，如 "84", "86" */
  cc: string;
  /** 显示文本，如 "+84" */
  label: string;
  /** flag-icons 国家代码，如 "vn", "cn" */
  flag?: string;
  /** 号码位数（不含区号），支持单值或多值 */
  phoneLength?: number | number[];
  /** 自定义验证正则，不传则按 phoneLength 自动生成 */
  pattern?: RegExp;
  /** 完全自定义验证函数，返回错误信息字符串表示失败，undefined 表示通过。优先级最高。 */
  validate?: (phone: string) => string | undefined;
}

export const DEFAULT_CC_OPTIONS: CountryCodeOption[] = [
  { cc: "84", label: "+84", flag: "vn", phoneLength: 10 },
  { cc: "86", label: "+86", flag: "cn", phoneLength: 11 },
];

/**
 * 根据 CountryCodeOption 生成验证函数。
 *
 * 优先级：validate > pattern > phoneLength。
 * validate 直接返回错误字符串（已经是最终文案）；
 * pattern / phoneLength 返回 i18n key + params，由组件内部翻译。
 */
export function buildValidator(
  option: CountryCodeOption,
): (phone: string) => { key: string; params?: Record<string, unknown> } | string | undefined {
  return (phone: string) => {
    if (!phone) return undefined;

    if (option.validate) {
      return option.validate(phone);
    }

    if (option.pattern) {
      return option.pattern.test(phone)
        ? undefined
        : { key: "globalPhone.invalidFormat" };
    }

    if (option.phoneLength != null) {
      const lengths = Array.isArray(option.phoneLength)
        ? option.phoneLength
        : [option.phoneLength];

      if (!/^\d+$/.test(phone)) {
        return { key: "globalPhone.invalidFormat" };
      }

      if (phone.startsWith("0")) {
        return { key: "globalPhone.noLeadingZero" };
      }

      if (!lengths.includes(phone.length)) {
        return {
          key: "globalPhone.invalidLength",
          params: { length: lengths.join("/") },
        };
      }
    }

    return undefined;
  };
}

/**
 * 表单场景下的便捷验证函数。
 *
 * 根据 cc 从 options 中匹配验证规则，返回错误信息字符串或 undefined（通过）。
 * 可直接用于表单 submit 前的校验。
 *
 * @param cc       当前区号
 * @param phone    当前号码
 * @param options  区号选项列表，默认使用内置预设
 * @param t        可选的翻译函数（传入 useEasyT() 的结果），不传则直接返回 i18n key
 */
export function validatePhone(
  cc: string,
  phone: string,
  options?: CountryCodeOption[],
  t?: (key: string, params?: Record<string, unknown>) => string,
): string | undefined {
  if (!phone) return t ? t("globalPhone.invalidFormat") : "globalPhone.invalidFormat";

  const resolved = options ?? DEFAULT_CC_OPTIONS;
  const option = resolved.find((o) => o.cc === cc);
  if (!option) return undefined;

  const result = buildValidator(option)(phone);
  if (!result) return undefined;
  if (typeof result === "string") return result;
  return t ? t(result.key, result.params) : result.key;
}
