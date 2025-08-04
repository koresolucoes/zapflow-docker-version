/**
 * Utilitários comuns para o sistema
 */

/**
 * Formata uma data para exibição
 * @param date Data a ser formatada
 * @returns Data formatada como string
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Verifica se um valor é vazio (null, undefined, string vazia, array vazio ou objeto vazio)
 * @param value Valor a ser verificado
 * @returns true se o valor for vazio, false caso contrário
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  
  if (typeof value === 'string' || Array.isArray(value)) {
    return value.length === 0;
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  
  return false;
}

/**
 * Remove propriedades indefinidas de um objeto
 * @param obj Objeto a ser limpo
 * @returns Novo objeto sem propriedades indefinidas
 */
export function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined) {
      result[key as keyof T] = value;
    }
  });
  
  return result;
}

/**
 * Gera um ID único
 * @returns String com ID único
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Verifica se um valor é um objeto
 * @param value Valor a ser verificado
 * @returns true se for um objeto, false caso contrário
 */
export function isObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Mescla dois objetos profundamente
 * @param target Objeto alvo
 * @param source Objeto fonte
 * @returns Novo objeto com a mesclagem
 */
export function deepMerge<T extends object, S extends object>(target: T, source: S): T & S {
  const result: any = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const targetValue = (target as any)[key];
      const sourceValue = source[key];
      
      if (isObject(targetValue) && isObject(sourceValue)) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else {
        result[key] = sourceValue;
      }
    }
  }
  
  return result as T & S;
}

// Exportar todos os utilitários
export * from './validation';
export * from './logger';

export default {
  formatDate,
  isEmpty,
  removeUndefined,
  generateId,
  isObject,
  deepMerge
};
