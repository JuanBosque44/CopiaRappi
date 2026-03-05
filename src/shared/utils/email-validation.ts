/**
 * Valida si el email es válido utilizando una expresión regular.
 * El email debe tener el formato "usuario@dominio.com"
 * @param email texto del email a validar.
 * @returns true si el email es válido, false de no ser así.
 */

export function validateEmail(email: string): boolean {
    if (!email.trim()) return false; 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}