/**
 * Utilitários de validação
 */

/**
 * Valida se um email é válido
 * @param email Email a ser validado
 * @returns true se o email for válido, false caso contrário
 */
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Valida se uma string é um UUID válido
 * @param uuid String a ser validada
 * @returns true se for um UUID válido, false caso contrário
 */
export function isValidUuid(uuid: string): boolean {
  const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return re.test(uuid);
}

/**
 * Valida se um objeto está vazio
 * @param obj Objeto a ser validado
 * @returns true se o objeto estiver vazio, false caso contrário
 */
export function isEmptyObject(obj: any): boolean {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
}

/**
 * Valida se uma string está vazia ou contém apenas espaços em branco
 * @param str String a ser validada
 * @returns true se a string estiver vazia ou contiver apenas espaços em branco, false caso contrário
 */
export function isBlank(str: string): boolean {
  return !str || /^\s*$/.test(str);
}

/**
 * Valida se um valor é um número
 * @param value Valor a ser validado
 * @returns true se o valor for um número, false caso contrário
 */
export function isNumber(value: any): value is number {
  return typeof value === 'number' && isFinite(value);
}

/**
 * Valida se um valor é uma string
 * @param value Valor a ser validado
 * @returns true se o valor for uma string, false caso contrário
 */
export function isString(value: any): value is string {
  return typeof value === 'string' || value instanceof String;
}

/**
 * Valida se um valor é uma função
 * @param value Valor a ser validado
 * @returns true se o valor for uma função, false caso contrário
 */
export function isFunction(value: any): value is Function {
  return typeof value === 'function';
}

/**
 * Valida se um valor é uma Promise
 * @param value Valor a ser validado
 * @returns true se o valor for uma Promise, false caso contrário
 */
export function isPromise(value: any): value is Promise<any> {
  return value && typeof value.then === 'function' && typeof value.catch === 'function';
}

export default {
  isValidEmail,
  isValidUuid,
  isEmptyObject,
  isBlank,
  isNumber,
  isString,
  isFunction,
  isPromise
};
